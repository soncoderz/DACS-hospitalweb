import 'package:flutter/material.dart';

/// Global navigation service to allow navigation from non-UI layers (e.g. interceptors).
class NavigationService {
  static final GlobalKey<NavigatorState> navigatorKey = GlobalKey<NavigatorState>();

  static BuildContext? get context => navigatorKey.currentContext;
}
