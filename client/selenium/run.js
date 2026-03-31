// =============================================================================
// SELENIUM TEST RUNNER - File chạy toàn bộ bộ test tự động Selenium
// =============================================================================
// File này là trung tâm của hệ thống test tự động Selenium cho Hospital Web.
// Nó thực hiện các việc sau:
//   1. Cấu hình browser (Chrome/Edge), headless hay có giao diện
//   2. Tự khởi động server + client nếu cần (--manage-servers)
//   3. Chạy các test case: đăng nhập, đặt lịch khám, thanh toán PayPal
//   4. Tạo report (JSON + TXT) và gửi email nếu có test thất bại
//
// Cách chạy:
//   node client/selenium/run.js [--headed] [--manage-servers] [--email-report]
// =============================================================================

const fs = require('fs');
const path = require('path');
const { spawn, spawnSync } = require('child_process');
const axios = require('axios');              // Gọi API backend để chuẩn bị dữ liệu test
const dotenv = require('dotenv');             // Đọc biến môi trường từ file .env
const { Builder, Browser, By, until } = require('selenium-webdriver'); // Thư viện Selenium WebDriver
const chrome = require('selenium-webdriver/chrome');  // Driver cho Chrome
const edge = require('selenium-webdriver/edge');      // Driver cho Edge

// --- Đường dẫn thư mục và script phụ trợ ---
const ROOT_DIR = path.resolve(__dirname, '..', '..');
const CLIENT_DIR = path.resolve(__dirname, '..');
const SERVER_DIR = path.resolve(ROOT_DIR, 'server');
const ARTIFACTS_DIR = path.resolve(__dirname, 'artifacts');           // Thư mục lưu report, ảnh chụp lỗi
const USER_HELPER_SCRIPT = path.join(SERVER_DIR, 'scripts', 'seleniumUserHelper.js');      // Script verify/xóa user test
const REPORT_EMAIL_SCRIPT = path.join(SERVER_DIR, 'scripts', 'sendSeleniumReportsEmail.js'); // Script gửi email report
const DEFAULT_ENV_FILES = ['.env.selenium.local', '.env.selenium'];   // File cấu hình Selenium

const args = new Set(process.argv.slice(2));

loadEnvFiles();

// Runner Selenium ưu tiên đọc file env cục bộ để có thể mang suite sang máy khác
// mà không phải hard-code URL, browser, hay tài khoản test.
function loadEnvFiles() {
  for (const fileName of DEFAULT_ENV_FILES) {
    const filePath = path.join(CLIENT_DIR, fileName);

    if (!fs.existsSync(filePath)) {
      continue;
    }

    const parsed = dotenv.parse(fs.readFileSync(filePath));

    for (const [key, value] of Object.entries(parsed)) {
      if (process.env[key] == null) {
        process.env[key] = value;
      }
    }
  }
}

function getBooleanEnv(name, fallback) {
  const value = process.env[name];
  if (value == null || value === '') {
    return fallback;
  }
  return ['1', 'true', 'yes', 'on'].includes(String(value).toLowerCase());
}

function getCommand(command, winCommand) {
  return process.platform === 'win32' ? winCommand : command;
}

function quoteShellArgument(value) {
  const text = String(value);

  if (!/[\s"]/u.test(text)) {
    return text;
  }

  if (process.platform === 'win32') {
    return `"${text.replace(/"/g, '""')}"`;
  }

  return `"${text.replace(/(["\\$`])/g, '\\$1')}"`;
}

function getManagedCommand(command, commandArgs) {
  if (process.platform !== 'win32') {
    return {
      command,
      commandArgs,
      shell: false,
    };
  }

  const cmdLine = [command, ...commandArgs].map(quoteShellArgument).join(' ');

  return {
    command: 'cmd.exe',
    commandArgs: ['/d', '/s', '/c', cmdLine],
    shell: false,
  };
}

function getBrowserName(value) {
  const browser = String(value || 'chrome').trim().toLowerCase();

  if (browser === 'chrome' || browser === 'googlechrome') {
    return 'chrome';
  }

  if (browser === 'edge' || browser === 'msedge' || browser === 'microsoftedge') {
    return 'edge';
  }

  throw new Error(`Unsupported SELENIUM_BROWSER "${value}". Use "chrome" or "edge".`);
}

function getPaypalFlow(value) {
  const flow = String(value || 'mock').trim().toLowerCase();

  if (flow === 'mock' || flow === 'sandbox') {
    return flow;
  }

  throw new Error(`Unsupported SELENIUM_PAYPAL_FLOW "${value}". Use "mock" or "sandbox".`);
}

// --- Cấu hình chính của Selenium runner ---
// Tất cả giá trị đều đọc từ biến môi trường, có giá trị mặc định hợp lý.
const config = {
  paypalFlow: getPaypalFlow(process.env.SELENIUM_PAYPAL_FLOW || 'mock'),
  paypalSandboxEmail: String(process.env.SELENIUM_PAYPAL_SANDBOX_EMAIL || '').trim(),
  paypalSandboxPassword: String(process.env.SELENIUM_PAYPAL_SANDBOX_PASSWORD || ''),
  paypalPopupTimeoutMs: Number(process.env.SELENIUM_PAYPAL_POPUP_TIMEOUT_MS || 90000),
  baseUrl: (process.env.SELENIUM_BASE_URL || 'http://127.0.0.1:3000').replace(/\/+$/, ''),    // URL trang web frontend
  apiUrl: (process.env.SELENIUM_API_URL || 'http://127.0.0.1:5000/api').replace(/\/+$/, ''),   // URL API backend
  browser: getBrowserName(process.env.SELENIUM_BROWSER || 'chrome'),   // Loại browser: chrome hoặc edge
  userEmail: String(process.env.SELENIUM_USER_EMAIL || '').trim().toLowerCase(),    // Email tài khoản test cố định
  userPassword: String(process.env.SELENIUM_USER_PASSWORD || ''),                  // Mật khẩu tài khoản test
  headless: args.has('--headed') ? false : getBooleanEnv('SELENIUM_HEADLESS', true), // Chạy ẩn (không hiện browser) hay hiện
  manageServers: args.has('--manage-servers') || getBooleanEnv('SELENIUM_MANAGE_SERVERS', false), // Tự khởi động server/client?
  emailReport: args.has('--email-report') || getBooleanEnv('SELENIUM_EMAIL_REPORT', false),      // Luôn gửi email report?
  emailOnFailure: getBooleanEnv('SELENIUM_EMAIL_ON_FAILURE', true),     // Chỉ gửi email khi có test thất bại?
  failureEmailTo: String(process.env.SELENIUM_FAILURE_EMAIL || 'sonkoi46fa@gmail.com').trim().toLowerCase(), // Email nhận report
  precheckWaitMs: Number(process.env.SELENIUM_PRECHECK_WAIT_MS || 15000),  // Thời gian chờ server sẵn sàng (ms)
  timeoutMs: Number(process.env.SELENIUM_TIMEOUT_MS || 20000),             // Timeout cho mỗi thao tác Selenium (ms)
  pollIntervalMs: Number(process.env.SELENIUM_POLL_INTERVAL_MS || 500),    // Khoảng cách giữa các lần kiểm tra lại (ms)
};

// Runner gọi thêm các script Node nhỏ cho việc thao tác DB thuần backend
// như verify/xóa user test và gửi email report sau khi chạy xong.
function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function slugify(value) {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'artifact';
}

function nowStamp() {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

function ensureArtifactsDir() {
  fs.mkdirSync(ARTIFACTS_DIR, { recursive: true });
}

function appendLog(message) {
  process.stdout.write(`${message}\n`);
}

function jsonLastLine(output) {
  const lines = String(output || '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  for (let index = lines.length - 1; index >= 0; index -= 1) {
    try {
      return JSON.parse(lines[index]);
    } catch (_) {
      // Ignore non-JSON log lines and keep scanning backward.
    }
  }

  if (!lines.length) {
    return null;
  }

  throw new Error(`Expected JSON output but received: ${lines.slice(-3).join(' | ')}`);
}

function runNodeScript(scriptPath, scriptArgs) {
  const command = process.execPath;
  const result = spawnSync(command, [scriptPath, ...scriptArgs], {
    cwd: path.dirname(scriptPath),
    encoding: 'utf8',
    env: process.env,
  });

  if (result.status !== 0) {
    throw new Error((result.stderr || result.stdout || 'Script execution failed').trim());
  }

  return jsonLastLine(result.stdout);
}

function deriveServerHealthUrl() {
  const api = new URL(config.apiUrl);
  return `${api.protocol}//${api.host}/health`;
}

async function waitForHttp(url, expectedStatus = 200, timeoutMs = 120000) {
  const deadline = Date.now() + timeoutMs;
  let lastError = null;

  while (Date.now() < deadline) {
    try {
      const response = await axios.get(url, {
        timeout: 5000,
        validateStatus: () => true,
      });

      if (response.status === expectedStatus) {
        return response;
      }

      lastError = new Error(`Received status ${response.status} from ${url}`);
    } catch (error) {
      lastError = error;
    }

    await sleep(config.pollIntervalMs);
  }

  throw lastError || new Error(`Timed out waiting for ${url}`);
}

async function isHttpReady(url, expectedStatus = 200) {
  try {
    const response = await axios.get(url, {
      timeout: 5000,
      validateStatus: () => true,
    });

    return response.status === expectedStatus;
  } catch (_) {
    return false;
  }
}

// Khi Selenium tự quản lý stack local, nó sẽ tự bật server/client hiện có
// và stream log của các process đó ra cùng terminal hiện tại.
function createManagedProcess(label, command, commandArgs, cwd) {
  const managedCommand = getManagedCommand(command, commandArgs);

  let child;

  try {
    child = spawn(managedCommand.command, managedCommand.commandArgs, {
      cwd,
      env: process.env,
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: managedCommand.shell,
    });
  } catch (error) {
    throw new Error(`Failed to start ${label}: ${error.message}`);
  }

  child.stdout.on('data', (chunk) => {
    process.stdout.write(`[${label}] ${chunk}`);
  });

  child.stderr.on('data', (chunk) => {
    process.stderr.write(`[${label}] ${chunk}`);
  });

  child.on('error', (error) => {
    process.stderr.write(`[${label}] failed to start: ${error.message}\n`);
  });

  child.on('exit', (code) => {
    process.stdout.write(`[${label}] exited with code ${code}\n`);
  });

  return child;
}

function stopProcessTree(child) {
  if (!child || child.exitCode != null) {
    return;
  }

  if (process.platform === 'win32') {
    spawnSync('taskkill', ['/pid', String(child.pid), '/t', '/f'], { stdio: 'ignore' });
    return;
  }

  try {
    process.kill(-child.pid, 'SIGTERM');
  } catch (_) {
    try {
      child.kill('SIGTERM');
    } catch (_) {
      // Ignore kill errors.
    }
  }
}

async function startLocalStack() {
  const managed = [];
  const serverHealthUrl = deriveServerHealthUrl();
  const clientUrl = `${config.baseUrl}/`;

  const [serverReady, clientReady] = await Promise.all([
    isHttpReady(serverHealthUrl),
    isHttpReady(clientUrl),
  ]);

  const npmCommand = getCommand('npm', 'npm');

  if (serverReady) {
    appendLog(`Reusing running server at ${serverHealthUrl}.`);
  } else {
    const serverProcess = createManagedProcess('server', npmCommand, ['run', 'dev'], SERVER_DIR);
    managed.push(serverProcess);
  }

  if (clientReady) {
    appendLog(`Reusing running client at ${clientUrl}.`);
  } else {
    const clientProcess = createManagedProcess(
      'client',
      npmCommand,
      ['run', 'dev', '--', '--host', '127.0.0.1', '--port', '3000', '--strictPort', '--open=false'],
      CLIENT_DIR
    );
    managed.push(clientProcess);
  }

  await waitForHttp(serverHealthUrl);
  await waitForHttp(clientUrl, 200);

  return managed;
}

function applyCommonBrowserArguments(options) {
  return options
    .addArguments('--window-size=1440,1200')
    .addArguments('--disable-dev-shm-usage')
    .addArguments('--disable-gpu')
    .addArguments('--disable-popup-blocking');
}

// Tạo WebDriver theo browser đã cấu hình trong env.
// `disableEnvironmentOverrides()` được giữ lại để Selenium không tự đọc
// các biến môi trường ngoài ý muốn rồi ghi đè browser đang chọn.
function createDriver() {
  if (config.browser === 'edge') {
    const options = applyCommonBrowserArguments(new edge.Options());

    if (config.headless) {
      options.addArguments('--headless=new');
    }

    return new Builder()
      .disableEnvironmentOverrides()
      .forBrowser(Browser.EDGE)
      .setEdgeOptions(options)
      .build();
  }

  const options = applyCommonBrowserArguments(new chrome.Options());

  if (config.headless) {
    options.addArguments('--headless=new');
  }

  return new Builder()
    .disableEnvironmentOverrides()
    .forBrowser(Browser.CHROME)
    .setChromeOptions(options)
    .build();
}

// =============================================================================
// CÁC HÀM HELPER THAO TÁC DOM - "Ngôn ngữ chung" của toàn bộ test suite
// =============================================================================
// Tất cả test đều dùng các hàm này để tương tác với giao diện web.
// Đặc điểm chính:
//   - Ưu tiên tìm phần tử bằng thuộc tính data-testid (ổn định hơn CSS class)
//   - Tự động chờ phần tử xuất hiện trước khi thao tác
//   - Xử lý scroll và click linh hoạt (fallback sang JS click nếu click thường lỗi)
//
// Các phần tử UI có data-testid được đặt sẵn trong các file React component
// (Login.jsx, Appointment.jsx, v.v.) để Selenium có thể tìm và thao tác.
// =============================================================================

// Chờ trang web tải xong hoàn toàn (document.readyState === 'complete')
async function waitForDocumentReady(driver) {
  await driver.wait(async () => {
    const readyState = await driver.executeScript('return document.readyState;');
    return readyState === 'complete';
  }, config.timeoutMs);
}

// Tìm phần tử theo data-testid, chờ cho đến khi phần tử xuất hiện và hiển thị
// Ví dụ: findByTestId(driver, 'login-form') sẽ tìm <form data-testid="login-form">
async function findByTestId(driver, testId, timeoutMs = config.timeoutMs) {
  const locator = By.css(`[data-testid="${testId}"]`);
  const element = await driver.wait(until.elementLocated(locator), timeoutMs);
  await driver.wait(until.elementIsVisible(element), timeoutMs);
  return element;
}

async function findByCss(driver, css, timeoutMs = config.timeoutMs) {
  const locator = By.css(css);
  const element = await driver.wait(until.elementLocated(locator), timeoutMs);
  await driver.wait(until.elementIsVisible(element), timeoutMs);
  return element;
}

async function hasCss(driver, css) {
  const elements = await driver.findElements(By.css(css));
  return elements.length > 0;
}

async function findByXpath(driver, xpath, timeoutMs = config.timeoutMs) {
  const locator = By.xpath(xpath);
  const element = await driver.wait(until.elementLocated(locator), timeoutMs);
  await driver.wait(until.elementIsVisible(element), timeoutMs);
  return element;
}

async function hasTestId(driver, testId) {
  const elements = await driver.findElements(By.css(`[data-testid="${testId}"]`));
  return elements.length > 0;
}

async function scrollIntoView(driver, element) {
  await driver.executeScript(
    'arguments[0].scrollIntoView({ block: "center", inline: "center" });',
    element
  );
}

async function clickElement(driver, element) {
  await scrollIntoView(driver, element);
  try {
    await element.click();
  } catch (_) {
    await driver.executeScript('arguments[0].click();', element);
  }
}

async function clickTestId(driver, testId) {
  const element = await findByTestId(driver, testId);
  await clickElement(driver, element);
}

async function submitFormFromButton(driver, testId) {
  const element = await findByTestId(driver, testId);
  await scrollIntoView(driver, element);
  // Ưu tiên `requestSubmit()` để mô phỏng submit form đúng chuẩn của browser,
  // tránh trường hợp click vào nút nhưng React/form không thực sự submit.
  await driver.executeScript(
    `
      const button = arguments[0];
      if (button.form && typeof button.form.requestSubmit === 'function') {
        button.form.requestSubmit(button);
        return;
      }

      button.click();
    `,
    element
  );
}

async function setInputValue(driver, testId, value) {
  const element = await findByTestId(driver, testId);
  await scrollIntoView(driver, element);
  await element.clear();
  await element.sendKeys(value);
}

async function setElementValue(driver, element, value) {
  try {
    await element.clear();
  } catch (_) {
    // Some third-party inputs do not support clear().
  }

  await element.sendKeys(value);
}

async function setCheckboxValue(driver, testId, checked) {
  const element = await findByTestId(driver, testId);
  const isChecked = await element.isSelected();
  if (isChecked !== checked) {
    await clickElement(driver, element);
  }
}

async function setSelectValue(driver, testId, value) {
  const element = await findByTestId(driver, testId);
  await scrollIntoView(driver, element);
  await driver.executeScript(
    `
      const select = arguments[0];
      const targetValue = arguments[1];
      select.value = targetValue;
      select.dispatchEvent(new Event('input', { bubbles: true }));
      select.dispatchEvent(new Event('change', { bubbles: true }));
    `,
    element,
    value
  );
}

async function isDisabled(driver, testId) {
  const element = await findByTestId(driver, testId);
  const disabled = await element.getAttribute('disabled');
  return disabled !== null;
}

async function waitForEnabled(driver, testId) {
  await driver.wait(async () => !(await isDisabled(driver, testId)), config.timeoutMs);
}

async function waitForDisabled(driver, testId) {
  await driver.wait(async () => Boolean(await isDisabled(driver, testId)), config.timeoutMs);
}

async function waitForUrlContains(driver, value) {
  await driver.wait(async () => (await driver.getCurrentUrl()).includes(value), config.timeoutMs);
}

async function findVisibleToastText(driver, toastKind) {
  const selector = toastKind
    ? `.Toastify__toast--${toastKind}`
    : '.Toastify__toast';
  const toasts = await driver.findElements(By.css(selector));

  for (const toast of toasts) {
    if (await toast.isDisplayed()) {
      const text = String(await toast.getText()).trim();
      if (text) {
        return text;
      }
    }
  }

  return '';
}

async function findOptionalVisibleByCss(driver, selectors, timeoutMs = config.timeoutMs) {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    for (const selector of selectors) {
      const elements = await driver.findElements(By.css(selector));

      for (const element of elements) {
        if (await element.isDisplayed()) {
          return element;
        }
      }
    }

    await sleep(config.pollIntervalMs);
  }

  return null;
}

async function clickOptionalByCss(driver, selectors, timeoutMs = config.timeoutMs) {
  const element = await findOptionalVisibleByCss(driver, selectors, timeoutMs);

  if (!element) {
    return false;
  }

  await clickElement(driver, element);
  return true;
}

async function clickOptionalByXpath(driver, xpaths, timeoutMs = config.timeoutMs) {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    for (const xpath of xpaths) {
      const elements = await driver.findElements(By.xpath(xpath));

      for (const element of elements) {
        if (await element.isDisplayed()) {
          await clickElement(driver, element);
          return true;
        }
      }
    }

    await sleep(config.pollIntervalMs);
  }

  return false;
}

async function waitForBookingSubmissionOutcome(driver, timeoutMs = config.timeoutMs * 3) {
  const deadline = Date.now() + timeoutMs;
  let lastUrl = '';

  // Sau khi bấm submit booking, suite chờ 1 trong 2 kết quả:
  // 1. đi tới trang lịch hẹn
  // 2. xuất hiện toast lỗi từ UI để trả ra nguyên nhân thật
  while (Date.now() < deadline) {
    lastUrl = await driver.getCurrentUrl();

    if ((await hasTestId(driver, 'appointments-page'))
      || (lastUrl.includes('/appointments') && !lastUrl.includes('/appointment?') && !lastUrl.endsWith('/appointment'))) {
      return;
    }

    const errorToast = await findVisibleToastText(driver, 'error');
    if (errorToast) {
      throw new Error(`Booking submit failed: ${errorToast}`);
    }

    await sleep(config.pollIntervalMs);
  }

  const errorToast = await findVisibleToastText(driver, 'error');
  if (errorToast) {
    throw new Error(`Booking submit failed: ${errorToast}`);
  }

  throw new Error(`Booking submit did not navigate to the appointments page in time. Current URL: ${lastUrl}`);
}

async function clearBrowserStorage(driver) {
  await driver.executeScript(`
    window.localStorage.clear();
    window.sessionStorage.clear();
  `);
}

async function getStoredAuthState(driver) {
  return driver.executeScript(`
    return {
      local: window.localStorage.getItem('userInfo'),
      session: window.sessionStorage.getItem('userInfo'),
    };
  `);
}

async function resetAppSession(driver) {
  await driver.manage().deleteAllCookies();
  await driver.get(`${config.baseUrl}/auth?mode=login&reset=${Date.now()}`);
  await waitForDocumentReady(driver);
  await clearBrowserStorage(driver);
  await driver.navigate().refresh();
  await waitForDocumentReady(driver);
}

async function waitForUserStorage(driver) {
  await driver.wait(async () => {
    const stored = await getStoredAuthState(driver);
    return Boolean(stored.local || stored.session);
  }, config.timeoutMs);

  return getStoredAuthState(driver);
}

async function openLoginPage(driver) {
  await driver.get(`${config.baseUrl}/auth?mode=login`);
  await waitForDocumentReady(driver);
  await findByTestId(driver, 'login-form');
}

async function waitForButtonToSettle(driver, testId) {
  await sleep(200);

  await driver.wait(async () => {
    const button = await findByTestId(driver, testId);
    return (await button.getAttribute('disabled')) === null;
  }, config.timeoutMs);
}

// Mô phỏng đăng nhập qua giao diện web (Login.jsx)
// Selenium tìm và điền vào các phần tử có data-testid tương ứng:
//   - 'login-email'       -> ô nhập email
//   - 'login-password'    -> ô nhập mật khẩu
//   - 'login-remember-me' -> checkbox ghi nhớ đăng nhập
//   - 'login-submit'      -> nút Đăng nhập
async function loginThroughUi(driver, { email, password, rememberMe = false }) {
  await openLoginPage(driver);
  await setInputValue(driver, 'login-email', email);
  await setInputValue(driver, 'login-password', password);
  await setCheckboxValue(driver, 'login-remember-me', rememberMe);
  await clickTestId(driver, 'login-submit');
}

// Hai helper này tách riêng case login thành công/thất bại để các test phía sau
// chỉ cần gọi lại, không phải tự viết logic chờ storage/url mỗi lần.
async function loginAndWaitForSuccess(driver, options) {
  await loginThroughUi(driver, options);

  const stored = await waitForUserStorage(driver);
  await driver.wait(async () => !(await driver.getCurrentUrl()).includes('/auth'), config.timeoutMs);

  return stored;
}

async function loginAndWaitForFailure(driver, options) {
  await loginThroughUi(driver, options);
  await waitForButtonToSettle(driver, 'login-submit');

  await driver.wait(async () => {
    const stored = await getStoredAuthState(driver);
    return !(stored.local || stored.session);
  }, config.timeoutMs);

  await waitForUrlContains(driver, '/auth');
}

async function loginForBooking(driver, userCredentials, rememberMe = false) {
  await loginAsUser(driver, userCredentials, rememberMe);
  await driver.get(`${config.baseUrl}/appointment`);
  await waitForDocumentReady(driver);
  await findByTestId(driver, 'booking-step-1');
}

// =============================================================================
// CÁC HÀM HELPER ĐẶT LỊCH KHÁM (BOOKING) - Mô phỏng wizard Appointment.jsx
// =============================================================================
// Bộ helper này mô phỏng đúng quy trình đặt lịch của người dùng thật:
//   Step 1: Chọn bệnh viện (booking-hospital) + chuyên khoa (booking-specialty)
//   Step 2: Chọn bác sĩ (booking-doctor-card) + dịch vụ (booking-service)
//   Step 3: Chọn ngày (booking-date-option) + giờ khám (booking-time-slot)
//   Step 4: Nhập thông tin triệu chứng, tiền sử bệnh
//   Step 5: Xác nhận và gửi đặt lịch (booking-submit)
async function completeBookingStep1(driver, scenario) {
  await findByTestId(driver, 'booking-step-1');
  await waitForDisabled(driver, 'booking-next-step-1');
  await setSelectValue(driver, 'booking-hospital', scenario.hospital._id);
  await findByTestId(driver, 'booking-specialty');
  await waitForDisabled(driver, 'booking-next-step-1');
  await setSelectValue(driver, 'booking-specialty', scenario.specialty._id);

  await driver.wait(async () => {
    if (await hasTestId(driver, 'booking-step-2')) {
      return true;
    }

    if (await hasTestId(driver, 'booking-next-step-1')) {
      return !(await isDisabled(driver, 'booking-next-step-1'));
    }

    return false;
  }, config.timeoutMs);
}

async function goToBookingStep2(driver, scenario) {
  await completeBookingStep1(driver, scenario);

  if (await hasTestId(driver, 'booking-next-step-1')) {
    await clickTestId(driver, 'booking-next-step-1');
  }

  await findByTestId(driver, 'booking-step-2');

  if (await hasTestId(driver, 'booking-next-step-2')) {
    await waitForDisabled(driver, 'booking-next-step-2');
  }
}

async function goToBookingStep3(driver, scenario) {
  await goToBookingStep2(driver, scenario);

  const doctorCard = await findByCss(
    driver,
    `[data-testid="booking-doctor-card"][data-doctor-id="${scenario.doctor._id}"]`
  );
  await clickElement(driver, doctorCard);

  await findByTestId(driver, 'booking-service');
  await setSelectValue(driver, 'booking-service', scenario.service._id);

  await driver.wait(async () => {
    if (await hasTestId(driver, 'booking-step-3')) {
      return true;
    }

    if (await hasTestId(driver, 'booking-next-step-2')) {
      return !(await isDisabled(driver, 'booking-next-step-2'));
    }

    return false;
  }, config.timeoutMs);

  if (!(await hasTestId(driver, 'booking-step-3')) && await hasTestId(driver, 'booking-next-step-2')) {
    await clickTestId(driver, 'booking-next-step-2');
  }

  await findByTestId(driver, 'booking-step-3');
}

async function selectBookingDateAndTime(driver, scenario) {
  const dateOption = await findByCss(
    driver,
    `[data-testid="booking-date-option"][data-date="${scenario.dateString}"]`
  );
  await clickElement(driver, dateOption);

  const timeSlot = await findByCss(
    driver,
    `[data-testid="booking-time-slot"][data-start-time="${scenario.timeSlot.startTime}"][data-end-time="${scenario.timeSlot.endTime}"]`
  );
  await clickElement(driver, timeSlot);
}

async function openAppointmentDetail(driver, appointmentId, options = {}) {
  const search = new URLSearchParams();

  if (options.seleniumPaypalMock) {
    search.set('selenium_paypal_mock', '1');
  }

  const query = search.toString() ? `?${search.toString()}` : '';
  await driver.get(`${config.baseUrl}/appointments/${appointmentId}${query}`);
  await waitForDocumentReady(driver);
  await findByTestId(driver, 'appointment-detail-page');
  const billing = await findByTestId(driver, 'user-billing', config.timeoutMs * 2);
  await scrollIntoView(driver, billing);
}

async function createPaypalApproval(token, appointmentId, billType = 'consultation') {
  const client = createAuthedApiClient(token);
  const response = await client.post('/payments/paypal/create', {
    appointmentId,
    billType,
  });

  assert(response.data?.success, 'Could not create a real PayPal approval request.');
  assert(response.data?.data?.approvalUrl, 'PayPal create response did not include approvalUrl.');

  return response.data.data;
}

async function openPopupWindow(driver, url) {
  const mainHandle = await driver.getWindowHandle();
  const existingHandles = await driver.getAllWindowHandles();

  await driver.executeScript(
    'window.open(arguments[0], "_blank", "width=1280,height=900,noopener,noreferrer");',
    url
  );

  const popupHandle = await driver.wait(async () => {
    const handles = await driver.getAllWindowHandles();
    return handles.find((handle) => !existingHandles.includes(handle)) || false;
  }, config.timeoutMs);

  await driver.switchTo().window(popupHandle);
  return { mainHandle, popupHandle };
}

async function waitForPaypalPopupSuccessPage(driver) {
  await driver.wait(async () => {
    const url = await driver.getCurrentUrl().catch(() => '');
    return url.includes('/payment/paypal/success');
  }, config.paypalPopupTimeoutMs);

  await waitForDocumentReady(driver);
  await findByTestId(driver, 'payment-status-success', config.paypalPopupTimeoutMs);
}

async function completeRealPaypalSandboxPopup(driver) {
  const deadline = Date.now() + config.paypalPopupTimeoutMs;
  let emailSubmitted = false;
  let passwordSubmitted = false;

  while (Date.now() < deadline) {
    const currentUrl = await driver.getCurrentUrl().catch(() => '');

    if (currentUrl.includes('/payment/paypal/success')) {
      await waitForPaypalPopupSuccessPage(driver);
      return;
    }

    if (currentUrl.includes('/payment/paypal/cancel')) {
      throw new Error('PayPal sandbox popup was cancelled.');
    }

    if (!emailSubmitted) {
      const emailInput = await findOptionalVisibleByCss(driver, [
        '#email',
        'input#email',
        'input[name="login_email"]',
        'input[name="email"]',
      ], 1500);

      if (emailInput) {
        await setElementValue(driver, emailInput, config.paypalSandboxEmail);
        const clickedNext = await clickOptionalByCss(driver, [
          '#btnNext',
          'button#btnNext',
          'button[name="btnNext"]',
          '[data-testid="btnNext"]',
        ], 5000);

        assert(clickedNext, 'Could not continue past the PayPal email step.');
        emailSubmitted = true;
        await sleep(1500);
        continue;
      }
    }

    const passwordInput = await findOptionalVisibleByCss(driver, [
      '#password',
      'input#password',
      'input[name="password"]',
    ], 1500);

    if (passwordInput && !passwordSubmitted) {
      await setElementValue(driver, passwordInput, config.paypalSandboxPassword);
      const clickedLogin = await clickOptionalByCss(driver, [
        '#btnLogin',
        'button#btnLogin',
        'button[name="btnLogin"]',
        '[data-testid="btnLogin"]',
      ], 5000);

      assert(clickedLogin, 'Could not submit the PayPal sandbox password.');
      passwordSubmitted = true;
      await sleep(2500);
      continue;
    }

    const clickedApprove = await clickOptionalByCss(driver, [
      '#payment-submit-btn',
      'button#payment-submit-btn',
      '#btnApprove',
      'button#btnApprove',
      '[data-testid="submit-button-initial"]',
      '[data-testid="submit-button"]',
    ], 1500);

    if (clickedApprove) {
      await sleep(2500);
      continue;
    }

    const clickedApproveByText = await clickOptionalByXpath(driver, [
      "//button[contains(., 'Complete Purchase')]",
      "//button[contains(., 'Pay Now')]",
      "//button[contains(., 'Agree & Pay')]",
      "//button[contains(., 'Continue')]",
      "//button[contains(., 'Hoan tat')]",
      "//button[contains(., 'Thanh toan')]",
    ], 1500);

    if (clickedApproveByText) {
      await sleep(2500);
      continue;
    }

    await sleep(config.pollIntervalMs);
  }

  throw new Error('Timed out completing the PayPal sandbox popup.');
}

async function completeRealPaypalConsultationPayment(driver, token, appointmentId) {
  await clickTestId(driver, 'billing-consultation-method-paypal');
  await clickTestId(driver, 'billing-consultation-pay-button');
  await findByTestId(driver, 'paypal-modal');
  await findByTestId(driver, 'paypal-sdk-container', config.paypalPopupTimeoutMs);

  const paypalOrder = await createPaypalApproval(token, appointmentId);
  const { mainHandle, popupHandle } = await openPopupWindow(driver, paypalOrder.approvalUrl);

  try {
    await completeRealPaypalSandboxPopup(driver);
  } finally {
    const handles = await driver.getAllWindowHandles();

    if (handles.includes(popupHandle)) {
      await driver.close();
    }

    await driver.switchTo().window(mainHandle);
  }

  await openAppointmentDetail(driver, appointmentId);

  const paidMethod = await findByTestId(driver, 'billing-consultation-paid-method', config.paypalPopupTimeoutMs);
  const paidMethodText = await paidMethod.getText();
  assert(/paypal/i.test(paidMethodText), 'Consultation bill should show PayPal as the paid method.');
}

// =============================================================================
// THANH TOÁN PAYPAL MOCK - Test luồng thanh toán không cần PayPal thật
// =============================================================================
// Suite KHÔNG mở popup PayPal thật. Thay vào đó:
//   1. Bấm nút chọn phương thức PayPal (billing-consultation-method-paypal) trong UserBilling.jsx
//   2. Bấm nút thanh toán (billing-consultation-pay-button)
//   3. Modal PayPal hiện ra (paypal-modal) - hiển thị PayPalButton.jsx ở chế độ mock
//   4. Bấm nút "Xác nhận PayPal mock" (paypal-mock-approve) trong PayPalButton.jsx
//   5. Kiểm tra UI hiển thị "PayPal" trong phương thức đã thanh toán
//   6. Kiểm tra bill từ API backend để xác nhận thật sự đã paid
async function completeMockPaypalConsultationPayment(driver) {
  await clickTestId(driver, 'billing-consultation-method-paypal');  // Chọn PayPal trong UserBilling.jsx
  await clickTestId(driver, 'billing-consultation-pay-button');     // Bấm nút thanh toán
  await findByTestId(driver, 'paypal-modal');                      // Chờ modal PayPal hiện ra
  await clickTestId(driver, 'paypal-mock-approve');                 // Bấm xác nhận mock trong PayPalButton.jsx

  // Chờ modal PayPal đóng lại (nghĩa là thanh toán xong)
  await driver.wait(async () => !(await hasTestId(driver, 'paypal-modal')), config.timeoutMs * 2);

  // Kiểm tra UI hiển thị phương thức thanh toán là PayPal
  const paidMethod = await findByTestId(driver, 'billing-consultation-paid-method', config.timeoutMs * 2);
  const paidMethodText = await paidMethod.getText();
  assert(/paypal/i.test(paidMethodText), 'Consultation bill should show PayPal as the paid method.');
}

async function takeScreenshot(driver, name) {
  ensureArtifactsDir();
  const filePath = path.join(ARTIFACTS_DIR, `${nowStamp()}-${slugify(name)}.png`);
  const screenshot = await driver.takeScreenshot();
  fs.writeFileSync(filePath, screenshot, 'base64');
  return filePath;
}

function buildMissingUserEmail() {
  return `selenium.missing.${Date.now()}@example.com`;
}

function buildBookingTestUser() {
  const uniqueSuffix = Date.now().toString();
  return {
    fullName: `Selenium Booking ${uniqueSuffix.slice(-6)}`,
    dateOfBirth: '1995-05-15',
    gender: 'male',
    address: 'Selenium Booking Address',
    email: `selenium.booking.${uniqueSuffix}@example.com`,
    phoneNumber: `09${uniqueSuffix.slice(-8)}`,
    password: 'HospitalApp@123',
  };
}

async function registerBookingTestUser(user) {
  const response = await axios.post(`${config.apiUrl}/auth/register`, {
    fullName: user.fullName,
    email: user.email,
    phoneNumber: user.phoneNumber,
    password: user.password,
    dateOfBirth: user.dateOfBirth,
    gender: user.gender,
    address: user.address,
  });

  assert(response.data?.success, 'Booking test user registration failed.');
  return response.data;
}

async function createVerifiedBookingUser() {
  const user = buildBookingTestUser();

  // User booking được tạo mới cho từng lần chạy để tránh phụ thuộc dữ liệu cũ.
  // Sau khi đăng ký xong, helper phía server sẽ đánh dấu verify trực tiếp trong DB.
  await registerBookingTestUser(user);

  const verified = runNodeScript(USER_HELPER_SCRIPT, ['verify', user.email]);
  assert(verified && verified.isVerified === true, 'Failed to verify booking test user.');

  return user;
}

function extractList(payload) {
  if (Array.isArray(payload)) {
    return payload;
  }

  const candidates = [
    payload?.data?.appointments,
    payload?.data?.hospitals,
    payload?.data?.specialties,
    payload?.data?.doctors,
    payload?.data?.services,
    payload?.data,
    payload?.appointments,
    payload?.hospitals,
    payload?.specialties,
    payload?.doctors,
    payload?.services,
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate;
    }
  }

  return [];
}

function normalizeDateOnly(dateValue) {
  const date = new Date(dateValue);
  const utcDate = new Date(Date.UTC(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    12,
    0,
    0
  ));
  return utcDate.toISOString().split('T')[0];
}

function isFutureSlot(dateString, startTime) {
  const [hours, minutes] = String(startTime).split(':').map(Number);
  const slotDate = new Date(`${dateString}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`);
  return slotDate.getTime() > Date.now();
}

async function loginViaApi(email, password) {
  const response = await axios.post(`${config.apiUrl}/auth/login`, {
    email,
    password,
    rememberMe: false,
  });

  assert(response.data?.success, 'API login failed while preparing booking scenario.');
  return response.data.data.token;
}

function createAuthedApiClient(token) {
  return axios.create({
    baseURL: config.apiUrl,
    timeout: 15000,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
}

function readId(value) {
  if (!value) {
    return '';
  }

  if (typeof value === 'object' && value._id) {
    return String(value._id);
  }

  return String(value);
}

function appointmentMatchesScenario(appointment, scenario) {
  return normalizeDateOnly(appointment.appointmentDate) === scenario.dateString
    && appointment.timeSlot?.startTime === scenario.timeSlot.startTime
    && readId(appointment.doctorId) === String(scenario.doctor._id)
    && readId(appointment.serviceId) === String(scenario.service._id);
}

async function waitForBookedAppointment(token, scenario) {
  const client = createAuthedApiClient(token);
  const deadline = Date.now() + config.timeoutMs * 2;
  let lastSeenCount = 0;

  // UI có thể điều hướng xong trước khi danh sách lịch hẹn của API cập nhật hoàn toàn,
  // nên suite poll lại patient history cho đến khi thấy đúng appointment vừa đặt.
  while (Date.now() < deadline) {
    const response = await client.get('/appointments/user/patient', {
      params: { page: 1, limit: 20 },
    });
    const appointments = extractList(response.data);
    lastSeenCount = appointments.length;
    const match = appointments.find((appointment) => appointmentMatchesScenario(appointment, scenario));

    if (match) {
      return match;
    }

    await sleep(config.pollIntervalMs);
  }

  throw new Error(`Could not find the booked appointment in patient history. Checked ${lastSeenCount} appointments.`);
}

async function waitForConsultationBillPaid(token, appointmentId) {
  const client = createAuthedApiClient(token);
  const deadline = Date.now() + config.timeoutMs * 2;

  // Sau bước PayPal mock, suite không chỉ nhìn UI mà còn kiểm tra bill thật từ API.
  while (Date.now() < deadline) {
    const response = await client.get(`/billing/appointment/${appointmentId}`);
    const bill = response.data?.data;

    if (bill?.consultationBill?.status === 'paid' && bill?.consultationBill?.paymentMethod === 'paypal') {
      return bill;
    }

    await sleep(config.pollIntervalMs);
  }

  throw new Error('Consultation bill was not marked as paid with PayPal in time.');
}

async function loginAsUser(driver, userCredentials, rememberMe = false) {
  await resetAppSession(driver);
  await loginAndWaitForSuccess(driver, {
    email: userCredentials.email,
    password: userCredentials.password,
    rememberMe,
  });
}

// Dữ liệu booking được dò động từ API thay vì hard-code ID,
// để suite vẫn chạy được khi doctor/schedule trong DB dev thay đổi.
async function findBookableScenario(token) {
  const client = createAuthedApiClient(token);

  const dailyLimitCache = new Map();
  let bestScenario = null;

  async function getDailyLimitForDate(dateString) {
    if (dailyLimitCache.has(dateString)) {
      return dailyLimitCache.get(dateString);
    }

    const response = await client.get('/appointments/user/patient/daily-count', {
      params: { date: dateString },
    });

    const limitInfo = {
      count: response.data?.data?.count ?? 0,
      limit: response.data?.data?.limit ?? 3,
    };

    dailyLimitCache.set(dateString, limitInfo);
    return limitInfo;
  }

  const hospitals = extractList((await client.get('/hospitals')).data)
    .filter((hospital) => hospital && hospital._id && hospital.isActive !== false);

  for (const hospital of hospitals) {
    const specialties = extractList((await client.get(`/hospitals/${hospital._id}/specialties`)).data);

    for (const specialty of specialties) {
      const doctors = extractList(
        (await client.get(`/appointments/hospitals/${hospital._id}/specialties/${specialty._id}/doctors`)).data
      );

      for (const doctor of doctors) {
        let services = extractList((await client.get(`/doctors/${doctor._id}/services`)).data);

        if (!services.length) {
          services = extractList((await client.get(`/appointments/specialties/${specialty._id}/services`)).data);
        }

        if (!services.length) {
          continue;
        }

        const schedules = extractList((await client.get(`/appointments/doctors/${doctor._id}/schedules`)).data)
          .filter((schedule) => schedule && schedule._id && schedule.isActive !== false);

        for (const schedule of schedules) {
          const dateString = normalizeDateOnly(schedule.date);
          const dailyLimitInfo = await getDailyLimitForDate(dateString);

          if (dailyLimitInfo.count >= dailyLimitInfo.limit) {
            continue;
          }

          for (const timeSlot of schedule.timeSlots || []) {
            const maxBookings = timeSlot.maxBookings || 3;
            const bookedCount = timeSlot.bookedCount || 0;
            // Đồng bộ với cách UI hiểu slot còn chỗ:
            // chỉ khi bookedCount chạm maxBookings thì slot mới bị xem là đầy.
            const slotAvailable = bookedCount < maxBookings;

            if (!slotAvailable) {
              continue;
            }

            if (!isFutureSlot(dateString, timeSlot.startTime)) {
              continue;
            }

            const remainingCapacity = maxBookings - bookedCount;
            const candidate = {
              hospital,
              specialty,
              doctor,
              service: services[0],
              schedule,
              dateString,
              timeSlot,
              remainingCapacity,
            };

            if (
              !bestScenario
              || candidate.remainingCapacity > bestScenario.remainingCapacity
              || (
                candidate.remainingCapacity === bestScenario.remainingCapacity
                && candidate.dateString < bestScenario.dateString
              )
            ) {
              bestScenario = candidate;
            }
          }
        }
      }
    }
  }

  if (bestScenario) {
    const { remainingCapacity, ...scenario } = bestScenario;
    return scenario;
  }

  throw new Error('Could not find any bookable hospital/specialty/doctor/schedule scenario.');
}

// Mỗi lần chạy đều ghi ra 2 file: JSON cho máy đọc và TXT cho người đọc.
// File TXT là nội dung chính được dùng khi gửi mail nếu suite bị fail.
function writeReport(report) {
  ensureArtifactsDir();

  const baseName = `${nowStamp()}-selenium-report`;
  const jsonPath = path.join(ARTIFACTS_DIR, `${baseName}.json`);
  const txtPath = path.join(ARTIFACTS_DIR, `${baseName}.txt`);

  fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2), 'utf8');

  const lines = [
    'Hospital Web Selenium Report',
    `Started: ${report.startedAt}`,
    `Finished: ${report.finishedAt}`,
    `Base URL: ${config.baseUrl}`,
    `API URL: ${config.apiUrl}`,
    `Browser: ${config.browser}`,
    `Headless: ${config.headless}`,
    `PayPal Flow: ${config.paypalFlow}`,
    '',
    `Passed: ${report.summary.passed}`,
    `Failed: ${report.summary.failed}`,
    '',
  ];

  for (const test of report.tests) {
    lines.push(`[${test.status.toUpperCase()}] ${test.name} (${test.durationMs} ms)`);
    if (test.notes) {
      lines.push(`Notes: ${test.notes}`);
    }
    if (test.screenshotPath) {
      lines.push(`Screenshot: ${test.screenshotPath}`);
    }
    if (test.error) {
      lines.push(`Error: ${test.error}`);
    }
    lines.push('');
  }

  if (report.scenario) {
    lines.push('Booking scenario');
    lines.push(`Hospital: ${report.scenario.hospital}`);
    lines.push(`Specialty: ${report.scenario.specialty}`);
    lines.push(`Doctor: ${report.scenario.doctor}`);
    lines.push(`Service: ${report.scenario.service}`);
    lines.push(`Date: ${report.scenario.date}`);
    lines.push(`Time: ${report.scenario.time}`);
    lines.push('');
  }

  fs.writeFileSync(txtPath, lines.join('\n'), 'utf8');

  return { jsonPath, txtPath };
}

function buildReportEmailSubject(report) {
  const failedCount = report.summary.failed || 0;
  const status = failedCount > 0 ? 'FAILED' : 'PASSED';
  return `Selenium ${status} - ${failedCount} failed - ${new Date().toISOString()}`;
}

// Phần gửi mail được tách khỏi thân test:
// nếu gửi mail lỗi thì không được che mất kết quả Selenium gốc,
// và chỉ gửi artifact của đúng lần chạy hiện tại.
async function maybeEmailReport(report, reportPaths) {
  const shouldEmail = config.emailReport || (config.emailOnFailure && report.summary.failed > 0);

  if (!shouldEmail || !config.failureEmailTo) {
    return null;
  }

  const args = [
    '--report',
    reportPaths.txtPath,
    '--to',
    config.failureEmailTo,
    '--subject',
    buildReportEmailSubject(report),
    '--artifact',
    reportPaths.jsonPath,
  ];

  for (const test of report.tests) {
    if (test.screenshotPath) {
      args.push('--artifact', test.screenshotPath);
    }
  }

  return runNodeScript(REPORT_EMAIL_SCRIPT, args);
}

async function runTest(report, name, executor) {
  appendLog(`Running: ${name}`);
  const startedAt = Date.now();

  // Mỗi test tự trả về `notes` để report cuối cùng không chỉ có pass/fail,
  // mà còn nói rõ test đó đã xác nhận điều gì.
  try {
    const notes = await executor();
    report.tests.push({
      name,
      status: 'passed',
      durationMs: Date.now() - startedAt,
      notes: notes || '',
    });
  } catch (error) {
    report.tests.push({
      name,
      status: 'failed',
      durationMs: Date.now() - startedAt,
      error: error.message,
      screenshotPath: error.screenshotPath || '',
    });
    throw error;
  }
}

async function attachFailureScreenshot(driver, error, name) {
  if (!driver) {
    return error;
  }

  try {
    error.screenshotPath = await takeScreenshot(driver, `${name}-failed`);
  } catch (_) {
    // Ignore screenshot capture errors and keep the original failure.
  }

  return error;
}

async function run() {
  ensureArtifactsDir();

  // report là nơi gom toàn bộ kết quả của phiên Selenium hiện tại.
  // Mỗi test ghi kết quả vào đây, rồi cuối suite mới xuất artifact/report.
  const report = {
    startedAt: new Date().toISOString(),
    finishedAt: null,
    tests: [],
    summary: { passed: 0, failed: 0 },
    scenario: null,
  };

  const managedProcesses = [];
  let driver = null;

  try {
    if (config.manageServers) {
      appendLog('Starting local server and client...');
      managedProcesses.push(...await startLocalStack());
    } else {
      appendLog(`Using ${config.browser} in ${config.headless ? 'headless' : 'headed'} mode.`);
      appendLog(`PayPal flow: ${config.paypalFlow}.`);
      await waitForHttp(deriveServerHealthUrl(), 200, config.precheckWaitMs);
      await waitForHttp(`${config.baseUrl}/`, 200, config.precheckWaitMs);
    }

    if (config.manageServers) {
      appendLog(`Using ${config.browser} in ${config.headless ? 'headless' : 'headed'} mode.`);
      appendLog(`PayPal flow: ${config.paypalFlow}.`);
    }

    driver = await createDriver();
    await driver.manage().setTimeouts({
      implicit: 0,
      pageLoad: 30000,
      script: 30000,
    });

    assert(config.userEmail, 'Missing SELENIUM_USER_EMAIL in client/.env.selenium.');
    assert(config.userPassword, 'Missing SELENIUM_USER_PASSWORD in client/.env.selenium.');
    if (config.paypalFlow === 'sandbox') {
      assert(!config.headless, 'Real PayPal sandbox popup requires headed mode. Set SELENIUM_HEADLESS=false or use --headed.');
      assert(config.paypalSandboxEmail, 'Missing SELENIUM_PAYPAL_SANDBOX_EMAIL in client/.env.selenium.');
      assert(config.paypalSandboxPassword, 'Missing SELENIUM_PAYPAL_SANDBOX_PASSWORD in client/.env.selenium.');
    }

    // =========================================================================
    // NHÓM 1: TEST ĐĂNG NHẬP - Dùng tài khoản cố định trong .env.selenium
    // Kiểm tra các trường hợp: email sai, mật khẩu sai, đăng nhập thành công
    // Tương tác với Login.jsx thông qua các data-testid:
    //   login-form, login-email, login-password, login-remember-me, login-submit
    // =========================================================================
    await runTest(report, 'login-rejects-unknown-email', async () => {
      const missingEmail = buildMissingUserEmail();

      await resetAppSession(driver);
      await loginAndWaitForFailure(driver, {
        email: missingEmail,
        password: 'HospitalApp@123!',
        rememberMe: false,
      });

      const stored = await getStoredAuthState(driver);
      assert(!stored.local && !stored.session, 'Unknown email login should not persist auth state.');
      return `Rejected unknown email ${missingEmail}.`;
    });

    await runTest(report, 'login-rejects-invalid-password', async () => {
      await resetAppSession(driver);
      await loginAndWaitForFailure(driver, {
        email: config.userEmail,
        password: `${config.userPassword}__invalid`,
        rememberMe: false,
      });

      const stored = await getStoredAuthState(driver);
      assert(!stored.local && !stored.session, 'Invalid password login should not persist auth state.');
      return `Rejected invalid password for ${config.userEmail}.`;
    });

    await runTest(report, 'login-success-session-storage', async () => {
      await resetAppSession(driver);

      const stored = await loginAndWaitForSuccess(driver, {
        email: config.userEmail,
        password: config.userPassword,
        rememberMe: false,
      });

      assert(Boolean(stored.session), 'Expected sessionStorage to contain userInfo after login without rememberMe.');
      assert(!stored.local, 'localStorage should stay empty when rememberMe is disabled.');

      await takeScreenshot(driver, 'login-success-session-storage');
      return `Logged in as ${config.userEmail} without rememberMe.`;
    });

    await runTest(report, 'login-success-remember-me-local-storage', async () => {
      await resetAppSession(driver);

      const stored = await loginAndWaitForSuccess(driver, {
        email: config.userEmail,
        password: config.userPassword,
        rememberMe: true,
      });

      assert(Boolean(stored.local), 'Expected localStorage to contain userInfo when rememberMe is enabled.');
      await takeScreenshot(driver, 'login-success-remember-me');
      return `Logged in as ${config.userEmail} with rememberMe enabled.`;
    });

    await runTest(report, 'booking-protected-route-redirects-to-auth', async () => {
      await resetAppSession(driver);
      await driver.get(`${config.baseUrl}/appointment`);
      await waitForDocumentReady(driver);
      await waitForUrlContains(driver, '/auth');
      return 'Anonymous user is redirected away from the protected booking route.';
    });

    // =========================================================================
    // NHÓM 2: TEST ĐẶT LỊCH KHÁM - Dùng user tạm do Selenium tự tạo
    // User được tạo mới mỗi lần chạy, verify qua seleniumUserHelper.js,
    // để suite không phụ thuộc trạng thái của tài khoản sẵn có trong DB.
    // Tương tác với Appointment.jsx thông qua các data-testid:
    //   booking-step-1/2/3/4/5, booking-hospital, booking-specialty,
    //   booking-doctor-card, booking-service, booking-date-option,
    //   booking-time-slot, booking-submit, v.v.
    // Sau khi đặt xong, kiểm tra trang Appointments.jsx:
    //   appointments-page, appointment-card
    // =========================================================================
    const bookingUser = await createVerifiedBookingUser();
    const authToken = await loginViaApi(bookingUser.email, bookingUser.password);
    const scenario = await findBookableScenario(authToken);
    let bookedAppointment = null;
    report.scenario = {
      hospital: scenario.hospital.name,
      specialty: scenario.specialty.name,
      doctor: scenario.doctor.user?.fullName || scenario.doctor.fullName || scenario.doctor._id,
      service: scenario.service.name,
      date: scenario.dateString,
      time: `${scenario.timeSlot.startTime}-${scenario.timeSlot.endTime}`,
    };

    await runTest(report, 'booking-step-1-requires-hospital-and-specialty', async () => {
      await loginForBooking(driver, bookingUser);

      await waitForDisabled(driver, 'booking-next-step-1');
      await setSelectValue(driver, 'booking-hospital', scenario.hospital._id);
      await findByTestId(driver, 'booking-specialty');
      await waitForDisabled(driver, 'booking-next-step-1');
      await setSelectValue(driver, 'booking-specialty', scenario.specialty._id);
      await driver.wait(async () => await hasTestId(driver, 'booking-step-2'), config.timeoutMs);

      return 'Booking step 1 stays blocked until both hospital and specialty are selected, then proceeds to step 2.';
    });

    await runTest(report, 'booking-step-2-requires-doctor-and-service', async () => {
      await loginForBooking(driver, bookingUser);
      await goToBookingStep2(driver, scenario);

      const doctorCard = await findByCss(
        driver,
        `[data-testid="booking-doctor-card"][data-doctor-id="${scenario.doctor._id}"]`
      );
      await clickElement(driver, doctorCard);
      if (await hasTestId(driver, 'booking-next-step-2')) {
        await waitForDisabled(driver, 'booking-next-step-2');
      }

      await findByTestId(driver, 'booking-service');
      await setSelectValue(driver, 'booking-service', scenario.service._id);
      await findByTestId(driver, 'booking-step-3');

      return 'Booking step 2 requires both doctor and service before proceeding to step 3.';
    });

    await runTest(report, 'booking-step-3-requires-date-and-time-slot', async () => {
      await loginForBooking(driver, bookingUser);
      await goToBookingStep3(driver, scenario);

      await waitForDisabled(driver, 'booking-next-step-3');

      const dateOption = await findByCss(
        driver,
        `[data-testid="booking-date-option"][data-date="${scenario.dateString}"]`
      );
      await clickElement(driver, dateOption);
      await waitForDisabled(driver, 'booking-next-step-3');

      const timeSlot = await findByCss(
        driver,
        `[data-testid="booking-time-slot"][data-start-time="${scenario.timeSlot.startTime}"][data-end-time="${scenario.timeSlot.endTime}"]`
      );
      await clickElement(driver, timeSlot);
      await waitForEnabled(driver, 'booking-next-step-3');

      return 'Booking step 3 requires both appointment date and time slot.';
    });

    await runTest(report, 'booking-flow-success', async () => {
      await loginForBooking(driver, bookingUser);
      await goToBookingStep3(driver, scenario);

      await waitForDisabled(driver, 'booking-next-step-3');
      await selectBookingDateAndTime(driver, scenario);
      await waitForEnabled(driver, 'booking-next-step-3');
      await clickTestId(driver, 'booking-next-step-3');

      await findByTestId(driver, 'booking-step-4');
      await setSelectValue(driver, 'booking-appointment-type', 'consultation');
      await setInputValue(driver, 'booking-symptoms', 'Selenium symptom note');
      await setInputValue(driver, 'booking-medical-history', 'No notable history');
      await setInputValue(driver, 'booking-notes', 'Created by automated Selenium test');
      await clickTestId(driver, 'booking-next-step-4');

      await findByTestId(driver, 'booking-step-5');
      await waitForEnabled(driver, 'booking-submit');
      await submitFormFromButton(driver, 'booking-submit');
      await waitForBookingSubmissionOutcome(driver, config.timeoutMs * 4);

      await findByTestId(driver, 'appointments-page', config.timeoutMs * 2);
      await driver.wait(async () => {
        const cards = await driver.findElements(By.css('[data-testid="appointment-card"]'));
        return cards.length > 0;
      }, config.timeoutMs * 2);

      const firstAppointmentCard = await findByCss(driver, '[data-testid="appointment-card"]');
      await scrollIntoView(driver, firstAppointmentCard);
      await sleep(300);

      const pageText = await (await findByTestId(driver, 'appointments-page')).getText();
      assert(pageText.includes(scenario.service.name), 'Booked service is not visible on the appointments page.');
      assert(pageText.includes(scenario.timeSlot.startTime), 'Booked time slot is not visible on the appointments page.');

      bookedAppointment = await waitForBookedAppointment(authToken, scenario);
      assert(bookedAppointment?._id, 'Could not resolve the booked appointment from patient history.');

      await takeScreenshot(driver, 'booking-success');
      return `Booked ${scenario.service.name} on ${scenario.dateString} at ${scenario.timeSlot.startTime}.`;
    });

    // =========================================================================
    // NHÓM 3: TEST THANH TOÁN PAYPAL - Kiểm tra luồng thanh toán phí khám
    // Sau khi booking thành công, mở trang AppointmentDetail.jsx với tham số
    // ?selenium_paypal_mock=1 để PayPalButton.jsx hiển thị chế độ mock.
    // Tương tác với UserBilling.jsx và PayPalButton.jsx thông qua data-testid:
    //   user-billing, billing-consultation-method-paypal,
    //   billing-consultation-pay-button, paypal-modal,
    //   paypal-mock-approve, billing-consultation-paid-method
    // =========================================================================
    await runTest(report, 'paypal-consultation-payment-success', async () => {
      assert(bookedAppointment?._id, 'Missing booked appointment for PayPal payment test.');
      const useRealPaypalSandbox = config.paypalFlow === 'sandbox';

      await loginAsUser(driver, bookingUser, useRealPaypalSandbox);
      await openAppointmentDetail(driver, bookedAppointment._id, {
        seleniumPaypalMock: !useRealPaypalSandbox,
      });

      if (useRealPaypalSandbox) {
        await completeRealPaypalConsultationPayment(driver, authToken, bookedAppointment._id);
      } else {
        await completeMockPaypalConsultationPayment(driver);
      }

      const paidBill = await waitForConsultationBillPaid(authToken, bookedAppointment._id);
      assert(paidBill.consultationBill.status === 'paid', 'Consultation bill should be marked as paid.');
      assert(paidBill.consultationBill.paymentMethod === 'paypal', 'Consultation bill should record PayPal as payment method.');

      await takeScreenshot(driver, 'paypal-consultation-payment-success');
      return `Paid consultation bill for appointment ${bookedAppointment._id} via PayPal ${useRealPaypalSandbox ? 'sandbox popup' : 'mock'}.`;
    });
  } catch (error) {
    throw await attachFailureScreenshot(driver, error, report.tests[report.tests.length - 1]?.name || 'run');
  } finally {
    if (driver) {
      try {
        await driver.quit();
      } catch (_) {
        // Ignore quit errors.
      }
    }

    for (const child of managedProcesses.reverse()) {
      stopProcessTree(child);
    }

    report.finishedAt = new Date().toISOString();
    report.summary.passed = report.tests.filter((test) => test.status === 'passed').length;
    report.summary.failed = report.tests.filter((test) => test.status === 'failed').length;

    const reportPaths = writeReport(report);

    try {
      const emailResult = await maybeEmailReport(report, reportPaths);
      if (emailResult) {
        appendLog(`Report email sent to ${emailResult.to} with ${emailResult.attachmentCount} attachments.`);
      }
    } catch (emailError) {
      appendLog(`Report email failed: ${emailError.message}`);
    }

    appendLog(`Report written to ${reportPaths.txtPath}`);
  }
}

run().then(() => {
  process.exit(0);
}).catch((error) => {
  process.stderr.write(`${error.message}\n`);
  process.exit(1);
});
