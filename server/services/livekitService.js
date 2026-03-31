const { AccessToken, RoomServiceClient } = require('livekit-server-sdk');

class LiveKitService {
  constructor() {
    this.apiKey = process.env.LIVEKIT_API_KEY;
    this.apiSecret = process.env.LIVEKIT_API_SECRET;
    this.wsUrl = process.env.LIVEKIT_WS_URL;

    if (!this.apiKey || !this.apiSecret || !this.wsUrl) {
      console.warn('Missing LiveKit credentials in environment variables');
      console.warn('LiveKit video call features will be disabled');
      this.isAvailable = false;
      return;
    }

    this.isAvailable = true;

    // Initialize Room Service Client for managing rooms
    const host = this.wsUrl.replace('wss://', 'https://').replace('ws://', 'http://');
    this.roomService = new RoomServiceClient(host, this.apiKey, this.apiSecret);
  }

  _checkAvailable(methodName) {
    if (!this.isAvailable) {
      console.warn(`LiveKit ${methodName} called but service is not available (missing credentials)`);
      return false;
    }
    return true;
  }

  /**
   * Generate access token for user to join a room
   * @param {string} roomName - Name of the room
   * @param {string} participantName - Name of the participant
   * @param {string} participantIdentity - Unique identity of the participant
   * @param {Object} metadata - Additional metadata
   * @returns {string} Access token
   */
  async generateToken(roomName, participantName, participantIdentity, metadata = {}) {
    if (!this._checkAvailable('generateToken')) return null;

    try {
      const at = new AccessToken(this.apiKey, this.apiSecret, {
        identity: participantIdentity,
        name: participantName,
        metadata: JSON.stringify(metadata)
      });

      // Grant permissions
      at.addGrant({
        roomJoin: true,
        room: roomName,
        canPublish: true,
        canSubscribe: true,
        canPublishData: true,
        canUpdateOwnMetadata: true
      });

      // Set token expiration (24 hours)
      at.ttl = '24h';

      const token = await at.toJwt();
      return token;
    } catch (error) {
      console.error('Error generating token:', error);
      throw error;
    }
  }

  /**
   * Create a new room
   * @param {string} roomName - Name of the room
   * @param {Object} options - Room options
   * @returns {Promise} Room creation result
   */
  async createRoom(roomName, options = {}) {
    if (!this._checkAvailable('createRoom')) return null;

    try {
      const room = await this.roomService.createRoom({
        name: roomName,
        emptyTimeout: options.emptyTimeout || 600, // 10 minutes
        maxParticipants: options.maxParticipants || 30,
        metadata: JSON.stringify(options.metadata || {})
      });
      return room;
    } catch (error) {
      console.error('Error creating room:', error); 
      throw error;
    }
  }

  /**
   * Delete a room
   * @param {string} roomName - Name of the room to delete
   * @returns {Promise} Deletion result
   */
  async deleteRoom(roomName) {
    if (!this._checkAvailable('deleteRoom')) return { success: false, reason: 'service_unavailable' };

    try {
      await this.roomService.deleteRoom(roomName);
      return { success: true };
    } catch (error) {
      console.error('Error deleting room:', error);
      throw error;
    }
  }

  /**
   * List all active rooms
   * @returns {Promise<Array>} List of active rooms
   */
  async listRooms() {
    if (!this._checkAvailable('listRooms')) return [];

    try {
      const rooms = await this.roomService.listRooms();
      return rooms;
    } catch (error) {
      console.error('Error listing rooms:', error);
      throw error;
    }
  }

  /**
   * Get room info
   * @param {string} roomName - Name of the room
   * @returns {Promise} Room information
   */
  async getRoomInfo(roomName) {
    if (!this._checkAvailable('getRoomInfo')) return null;

    try {
      const rooms = await this.roomService.listRooms([roomName]);
      return rooms.length > 0 ? rooms[0] : null;
    } catch (error) {
      console.error('Error getting room info:', error);
      throw error;
    }
  }

  /**
   * List participants in a room
   * @param {string} roomName - Name of the room
   * @returns {Promise<Array>} List of participants
   */
  async listParticipants(roomName) {
    if (!this._checkAvailable('listParticipants')) return [];

    try {
      const participants = await this.roomService.listParticipants(roomName);
      return participants;
    } catch (error) {
      console.error('Error listing participants:', error);
      throw error;
    }
  }

  /**
   * Remove a participant from a room
   * @param {string} roomName - Name of the room
   * @param {string} identity - Identity of the participant to remove
   * @returns {Promise} Removal result
   */
  async removeParticipant(roomName, identity) {
    if (!this._checkAvailable('removeParticipant')) return { success: false, reason: 'service_unavailable' };

    try {
      await this.roomService.removeParticipant(roomName, identity);
      return { success: true };
    } catch (error) {
      console.error('Error removing participant:', error);
      throw error;
    }
  }

  /**
   * Mute/unmute a participant's track
   * @param {string} roomName - Name of the room
   * @param {string} identity - Identity of the participant
   * @param {string} trackSid - Track SID
   * @param {boolean} muted - Mute state
   * @returns {Promise} Update result
   */
  async muteParticipant(roomName, identity, trackSid, muted) {
    if (!this._checkAvailable('muteParticipant')) return { success: false, reason: 'service_unavailable' };

    try {
      await this.roomService.mutePublishedTrack(roomName, identity, trackSid, muted);
      return { success: true };
    } catch (error) {
      console.error('Error muting participant:', error);
      throw error;
    }
  }

  /**
   * Generate token for admin access
   * @param {string} roomName - Name of the room
   * @param {Object} adminInfo - Admin information
   * @returns {string} Admin access token
   */
  async generateAdminToken(roomName, adminInfo) {
    if (!this._checkAvailable('generateAdminToken')) return null;

    const at = new AccessToken(this.apiKey, this.apiSecret, {
      identity: adminInfo.id,
      name: adminInfo.name,
      metadata: JSON.stringify({
        role: 'admin',
        ...adminInfo.metadata
      })
    });

    // Grant full admin permissions
    at.addGrant({
      roomJoin: true,
      room: roomName,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
      canUpdateOwnMetadata: true,
      roomAdmin: true,
      roomRecord: true,
      hidden: adminInfo.hidden || false // Admin can be hidden from other participants
    });

    at.ttl = '24h';
    return await at.toJwt();
  }
}

module.exports = new LiveKitService();
