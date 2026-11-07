# Networking, Venue Readiness and Deployment

**Status:** design. Statements about operating systems, routers, browsers and firewalls are assumptions unless listed as verified in `VERIFIED_VS_ASSUMED.md`. Nothing here is implemented. Limits are cited by ID (`reference/limits.md`); the screens involved are `FD-05`, `FD-06` and `FD-07` in `SCREEN_SPEC.md`.

## 1. What the design depends on

Participants' devices must be able to reach the Facilitator's computer on the same local network. Internet access is not required. This is the most important practical risk of the product: if the network blocks device-to-device traffic, the product cannot work there, whatever the software does.

- The most reliable setup is a Facilitator-controlled Wi-Fi access point or router with **client isolation turned off**, with the Facilitator's laptop on it (wired where convenient).
- A phone or laptop **hotspot** may work, but behaviour varies by operating system and hotspot, and some hotspots limit how many devices can connect. A built-in Windows hotspot is **believed** to allow only a small number of clients (about 8); this is unverified. For more than about 30 participants, use a dedicated travel router or access point.
- **Venue guest Wi-Fi** often blocks device-to-device traffic even when every device shows connectivity. Do not promise otherwise.
- The product must not require a DNS name, mDNS (`.local`) names, internet access, a captive-portal login or any online service to join.

## 2. Listeners and exposure

Described in `ARCHITECTURE.md` section 3. In summary: the participant listener exists **only while Live**, is bound only to the chosen interface address, and is stopped when presenting ends. The Facilitator Workspace needs no network at all.

- The Facilitator Workspace and the Projector view show a clear **"LAN active / LAN inactive"** indicator, the interface in use and the join address. An interface that merely has an IP address is never described as reachable.
- The participant port is **fixed and configurable** (so firewall rules and the QR code stay stable). The default is chosen in Stage 2 and avoids common ports such as 80, 443 and 8080 (open item `O-001`).

## 3. Join address, QR code and joining

- The **join address is a complete URL**: `http://<interface-address>:<port>/j/<join-code>`. The QR code encodes exactly this URL. The projector shows it in large type beside the QR code on every slide.
- The core builds it from the chosen interface address, the participant port and the join code. Pages never build it from their own location. **Test:** the QR content equals the expected URL and never contains `127.0.0.1` or `localhost` (`AT-PRES-005`).
- If someone opens only `http://<address>:<port>/`, a landing page asks for the join code.
- The QR code is generated locally. It is large enough to be scanned from the back of a typical room; the manual recommends testing from the farthest seat.
- Participants who cannot scan can type the address shown; a printed shortened address is not offered because it would need an online service.

## 4. Choosing the network interface

- The app lists network interfaces, excludes loopback, and **recommends** one: a private IPv4 address on an interface with a default route, preferring Wi-Fi or Ethernet over virtual, container, VPN and tunnel adapters where they can be reliably recognised. IPv4 only in version 1.
- The Facilitator can choose any other interface. The dialog shows name, address and a warning when reachability is uncertain.
- If detection fails, a guided manual entry is offered (`NET_NO_INTERFACE`).
- Detection of interface *type* is operating-system specific and not always reliable; the app therefore recommends and shows, and never silently decides.

## 5. Readiness check ("Network Check")

Available from the Start presenting dialog and from the Help menu, before an event (`FD-06`):

1. Start the participant listener on the chosen interface and confirm it answers locally on that address.
2. Show the join address and QR code.
3. **Invite a real device:** a phone joins using the QR code and submits a test response; the app shows it arrived and the round-trip time.
4. If no device connects within about a minute, show the troubleshooting sequence (section 6).

The check states plainly that **local checks cannot prove that every device in the venue can connect**; only a real-device test can, and it should be done in the room, from the far seats, ideally with a few different phones. Closing the check stops the listener.

## 6. Troubleshooting sequence

If a participant cannot join, the app and the manual walk through these in order, with plain-language messages first and technical details on request:

1. Is the Activity Live and accepting participants? Is the participant limit reached?
2. Is the participant using the **current** QR code or address and join code?
3. Is the participant's phone on the **same Wi-Fi network** as the laptop? (Mobile data on, or a different Wi-Fi, is the most common cause.)
4. Does the displayed address belong to the intended Wi-Fi or Ethernet interface, and not to a VPN or virtual adapter?
5. Does the Wi-Fi use **client isolation** or a guest network that blocks device-to-device traffic?
6. Is the operating-system firewall blocking the port (section 7)?
7. Re-run the Network Check and try another device.
8. Did the address change? Refresh the QR and have participants reconnect (section 9).

The app never recommends turning the firewall off.

## 7. Firewall guidance

The application **never changes firewall rules by itself**. Guidance is manual first; any future installer option to add a rule must be narrow, explain itself, require explicit approval and say how to remove it.

- **Windows:** the first time the participant listener starts, Windows may ask whether to allow the app on networks. Allow **private** networks only. The exact prompt varies by version and is to be confirmed on a real machine.
- **Fedora:** if the firewall is blocking, a runtime rule can be added for testing and removed afterwards, for example `sudo firewall-cmd --add-port=<port>/tcp` (not `--permanent`) and `sudo firewall-cmd --remove-port=<port>/tcp` afterwards. To check what the app is listening on: `ss -tlnp`.
- **Ubuntu:** if `ufw` is enabled, a narrow rule limited to the local subnet, for example `sudo ufw allow from <subnet> to any port <port> proto tcp`, and `sudo ufw delete allow from <subnet> to any port <port> proto tcp` to remove it.
- These commands are examples to be checked against the real systems in the Stage 2 spike (`VERIFIED_VS_ASSUMED.md`). The manual explains what they do and how to undo them.

## 8. Participant page on plain HTTP

The participant page is served over plain HTTP to a private address. Consequences that the design already accounts for:

- **Browser features that exist only on secure origins are unavailable** to the participant page. The page must not rely on `crypto.randomUUID`, `crypto.subtle`, the clipboard API, service workers or the screen wake lock. Submission IDs and the login proof use `crypto.getRandomValues` (believed available on plain HTTP; to be verified) and a small bundled hash/HMAC library, with a safe fallback if a feature is missing.
- Browsers may show a "not secure" notice. As of October 2026, Chrome's move to HTTPS-by-default for browsing is reported to exempt private addresses without a warning; this could change, so the manual says so, and a local-HTTPS spike is kept as an optional later item (`O-009`).
- No cookies marked `Secure`. Tokens never appear in URLs.
- **No external resources of any kind:** no CDN scripts, no remote fonts, no analytics, no remote images, no online QR service. Everything is bundled and served by the app. A test loads the participant and projector pages with the network disconnected and fails on any outside request (`AT-NET-003`).
- **Screen lock:** the browser feature that keeps a phone awake is unavailable on plain HTTP. Phones may sleep and drop the connection; the page reconnects automatically (`PROTOCOL_SPEC.md` section 6). The join page tells participants to keep their screen on.

## 9. Network changes while Live

The app watches the chosen interface. If its address changes or the interface disappears (`AT-NET-004`):

1. Everything committed so far is kept.
2. A clear warning appears on the Facilitator Workspace (`NET_INTERFACE_CHANGED`), and the projector shows that participants may need to rejoin.
3. The Facilitator confirms or chooses an interface. **The app never silently switches networks or resets anything.**
4. The new QR code and address are shown. If the port can be kept, only the address changes.
5. Participants reconnect by scanning the new code; roster participants log in again if their token was lost; anonymous participants who lose their token appear as new participants (documented limitation).
6. The change is recorded in the event log.

## 10. Capacity and participant limit

- The participant limit is a Facilitator setting enforced on the server. When it is reached, new participants see "This activity is full" (`activity_full`); already admitted participants who reconnect are not refused or counted twice.
- The Start presenting dialog **warns if the chosen limit is above the validated capacity** for the release. Until a validation exists the default limit is `LIM-PRES-DEFAULT-PARTICIPANT-LIMIT`.
- Capacity depends on the laptop, the access point's airtime and client handling, interference, activity type and browser behaviour. Nothing is promised beyond what has been measured (`QUALITY_AND_RELEASE.md` section 6).

## 11. Packaging, installation and updates

- **Deliverables:** a native Windows installer and a suitable Linux package. Docker is not required. Exact package formats are an open decision for the packaging stage (`O-007`).
- **Installation checks:** shortcuts, file association for `.actvty` (opening a file passes its path to an already running instance), first-run behaviour, upgrade and uninstall, firewall prompt behaviour, antivirus reactions.
- **Updates:** no automatic updating. An optional update check may run **only when the Facilitator asks and only when online**. An update is never offered or installed while an Activity is Live. A failed update must leave the previous version usable (keep the previous installer; on Linux rely on the package manager's rollback). The updater choice is open and may be deferred beyond version 1; version 1 may simply publish releases.
- **No telemetry** and no mandatory online activation.
- **Windows verification:** CI builds and tests on Windows from Stage 1; the first hands-on Windows test of joining, firewall prompt and Projector view is planned at the end of Stage 2 if a Windows machine is available, and is a release requirement before any Windows support is claimed (`ROADMAP.md`).

## 12. Venue checklist (before an event)

- Install and launch on the actual Facilitator computer; then disconnect the internet and test again.
- Confirm all interface text, fonts and images are bundled (the offline page-load test passes).
- Connect several different phones to the access point you will use and run a Network Check from the far seats.
- Test a phone's screen lock, Wi-Fi disconnect and reconnect, and an application restart.
- Confirm the displayed QR code and address are correct and the participant limit suits the group.
- Plug the laptop into power and check its sleep, lid-close and screen-saver settings; the app asks the system to stay awake while Live, but this is not guaranteed on every system.
- Know the firewall prompts and whether a rule is needed on this computer.
- Open the Projector view on the real projector at its real resolution; check the corner join area and text size from the back.
- Keep a **fallback plan** for network failure (for example a pre-printed copy of the results grid, or running the quiz verbally).

## 13. Manual and in-app help topics

The manual and the in-app help must cover, in plain language: choosing a network; the Network Check; the troubleshooting sequence; firewall prompts; hotspot limits; client isolation; what to do if the address changes; participant limit; what plain HTTP means for privacy; keeping phone screens awake; anonymous versus identified results; why roster login is needed for graded work; PIN handling and credential sheets; Reset and safety copies; recovery after a crash; file protection and the lost-password warning; locked files; reading a report's provenance block; saving a copy for an older version; who can read an Activity file on the same computer; and the Known limitations list from the vision and security documents.
