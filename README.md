# WatchNSync

WatchNSync is a browser-based watch party application for watching YouTube videos together in shared rooms. A room keeps its video and playback state synchronized through a server-authoritative Socket.IO connection while allowing the Host to manage the party.

Live application: [https://watchnsync.onrender.com](https://watchnsync.onrender.com)

## Core features

- Create a room and automatically join it as the Host.
- Join with a room code or shared room URL and a display name.
- Synchronize YouTube video selection, play, pause, and seek actions.
- Display connected participants and their roles.
- Assign Participant and Moderator roles.
- Transfer Host status to another non-Host participant.
- Enable or disable Moderator participant-management permissions.
- Remove eligible participants from a room.
- Leave a room without interrupting the party.
- End a watch party for everyone.
- Enforce a maximum room capacity of 150 participants.

## Tech stack

- React 19 and TypeScript
- Vite
- React Router
- Tailwind CSS
- Node.js and Express
- Socket.IO and Socket.IO Client
- YouTube IFrame Player API

## Architecture

- **React/Vite frontend:** The browser application provides the home, room creation, joining, and room views. React Router handles client-side routes.
- **Express backend:** Provides the health endpoint, room-creation API, static production assets, and the React Router fallback.
- **Socket.IO real-time layer:** Runs on the same Node HTTP server as Express and broadcasts room membership, permissions, and playback updates.
- **In-memory room state:** `RoomManager` stores rooms, participants, roles, moderator-management settings, and shared playback state in process memory.
- **YouTube IFrame API:** The frontend embeds and controls the selected YouTube video. The server remains authoritative for shared playback state.

## Local setup

Requirements: a current Node.js installation and npm.

```bash
npm install
npm run dev
```

The Vite development server runs the frontend. In a separate terminal, run the backend for API and Socket.IO development:

```bash
npm run dev:server
```

The Vite development server proxies `/api` requests to `http://localhost:3000`. The frontend Socket.IO client uses the development server at `http://localhost:3000` by default.

## Available npm scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Start the Vite frontend development server. |
| `npm run dev:server` | Start the Express and Socket.IO server with `tsx watch`. |
| `npm run build` | Type-check and build the frontend, then build the server. |
| `npm run build:client` | Type-check and build the Vite frontend into `dist`. |
| `npm run build:server` | Compile the server into `server-dist`. |
| `npm run preview` | Preview the Vite production frontend separately. |
| `npm start` | Start the compiled Express and Socket.IO server. |

## Production build and start

The single-service production workflow is:

```bash
npm install
npm run build
npm start
```

After `npm run build`, Express serves the generated `dist` directory and returns `dist/index.html` for client-side React Router routes such as `/join` and `/room/:roomId`. The same HTTP server continues to serve `/api/*` and Socket.IO traffic.

## Environment variables

The application reads these environment variables:

- `PORT`: HTTP port for the server. Defaults to `3000` when not provided. Render supplies this value automatically.
- `HOST`: Server bind host. Defaults to `0.0.0.0`.
- `VITE_SOCKET_URL`: Optional frontend build-time Socket.IO URL. In production, the client defaults to the current browser origin when this variable is not set. In development, it defaults to `http://localhost:3000`.

## WebSocket flow and important events

The frontend connects to Socket.IO when entering a room and sends `join_room` with a room ID and username. The server validates the request, assigns the role, joins the socket to the room, and sends the current `sync_state`.

Important client-to-server events:

- `join_room`
- `leave_room`
- `change_video`
- `play`
- `pause`
- `seek`
- `assign_role`
- `transfer_host`
- `set_moderator_management`
- `remove_participant`
- `end_watch_party`

Important server-to-client events:

- `sync_state`
- `user_joined`
- `user_left`
- `role_assigned`
- `host_transferred`
- `permissions_updated`
- `participant_removed`
- `party_ended`
- `connect`
- `disconnect`

Playback updates are stored by the server and broadcast to all sockets in the room. Clients apply the received state to their YouTube player without using client-supplied role claims.

## Role and permission model

### Host

- The first participant in a newly created room becomes Host.
- Controls global video change, play, pause, and seek.
- Can assign or remove Moderator status for eligible non-Host participants.
- Can transfer Host status to another non-Host participant.
- Can enable or disable Moderator participant-management permissions.
- Can remove eligible non-Host participants.
- Can end the watch party.

### Moderator

- Can use global video and playback controls.
- Can manage eligible non-Host participants only when the Host enables Moderator management.
- Cannot change or remove the Host role.
- Cannot transfer Host status or end the watch party.

### Participant

- Joins as Participant by default.
- Receives synchronized room playback state.
- Can use the local Sync action to restore the current authoritative state.
- Cannot change the shared room playback state or manage other participants.

All role and playback authorization is enforced by the server from stored room state.

## Room management behavior

- **Host transfer:** The current Host can transfer Host status to another non-Host participant. The previous Host becomes a Participant, leaving exactly one Host.
- **Participant removal:** The Host can always remove non-Host participants. Moderators can do so only when Moderator management is enabled. The removed user receives an in-app message, is returned to the home screen, and is prevented from rejoining with the removed socket connection.
- **Moderator management:** The Host controls a room-level setting that determines whether Moderators may assign eligible roles and remove eligible non-Host participants.
- **Leaving:** Participants and Moderators can leave at any time. If the Host leaves or disconnects, the server promotes a Moderator first, or otherwise another remaining participant, so the room does not continue without a Host.
- **Ending a room:** The Host-only End Watch Party action deletes the room state, broadcasts `party_ended`, clears connected users' room membership, and returns connected clients to the home screen. Later joins fail because the room no longer exists.
- **Capacity:** A room accepts up to 150 participants. Additional join attempts receive a clear `Room is full.` error.

## Deploying on Render

Deploy the repository as a single Render Web Service:

1. Set the build command to `npm run build`.
2. Set the start command to `npm start`.
3. Use the Render-provided `PORT`; no hard-coded production port is required.
4. The service binds to `0.0.0.0` by default.

The deployed application is available at [https://watchnsync.onrender.com](https://watchnsync.onrender.com).

## Key technical decisions

- A single Node HTTP server hosts Express and Socket.IO so API, frontend, and real-time traffic share the same deployment.
- Room and playback authority stays on the server rather than trusting client role or playback claims.
- Room state is intentionally in memory to keep the project small and dependency-light.
- React Router uses an Express fallback so direct navigation to frontend routes works in production.
- YouTube video IDs are validated before they are accepted for shared playback.

## Known limitations

- Room state is stored only in memory and is lost when the server process restarts or redeploys.
- A free Render instance may sleep when idle, which can delay the first request after inactivity.
- Browser and YouTube autoplay restrictions may prevent automatic remote playback until the user interacts with the page.
- There is no persistent account, authentication, or database layer.

## Future work

The following are intentionally future improvements rather than current features:

- Persistent room storage and recovery.
- Authentication and account-based room access.
- More robust multi-instance scaling and shared state.
- Additional playback and connection recovery UX for browser autoplay restrictions.
