# Click and Roll

A chrome extension that lets you hover on an NBA player's name on any web page to quickly view their stats.

## To Do

### Features

#### MVP

- [x] Highlight player names on page load
- [x] Highlight player names in dynamically loaded elements
- [x] Placeholder overlay when hovering player name
- [x] Fetch data from stats.nba.com api on hover
- [x] Display data in overlay
- [x] Make overlay dismissable
- [x] Make data readable
- [x] Custom overlay styling
- [x] Add player pic, with placeholder if unavailable
- [x] Add basic player info
- [x] Make year column, header row of table scroll with the user, for easier readability
- [x] Loading message while fetching data
- [x] Add career figures
- [x] Add all star marker
- [x] Toggle on/off
- [x] Close overlay on toggle off
- [x] Disable for this site
- [x] Donate link
- [x] Github link
- [ ] Contact link
- [ ] ReadMe link
- [ ] User-friendly network error messages
- [x] Extension icon
- [ ] Expand ReadMe with features, credits

#### Other

- [ ] Add postseason stats tab
- [ ] Add advanced stats tab
- [ ] Add accolades to profile (if feasible with API)
- [ ] Add player text profile
- [ ] Add last game for active players
- [ ] User choice of highlight colour (including none)
- [ ] User choice of dynamic highlighting
- [ ] Periodically update player list

### Optimisations

#### MVP

- [x] Fetch player names from api and store locally on first use
- [x] Store most recently viewed player id and do not repeat API call if user scrolls over same player
- [x] Explore possible time-savings for mutation observer implementation
- [ ] Light refactor to make index files as minimal as possible
- [ ] Test coverage for ClickAndRoll object prototype
- [x] Introduce isRunning variable to ClickAndRoll to prevent duplicate starts/stops

#### Other

- [ ] Explore moving text searches to background script
- [ ] Explore caching stats of commonly used players to reduce network requests

### Fixes

#### MVP

- [x] Fix negative result start offset when part of name has text formatting
- [x] Fix overlay not appearing over other elements
- [x] Fix absolute offset calculation errors when offsetParent does not cascade up to original document body
- [x] Fix unavailable stats to display 'n/a' or similar
- [x] Fix overlay sometimes not closing correctly
- [x] Fix close button sometimes not centered properly
- [x] Fix issue when current node has no parent node while locating matches
- [x] Fix issue with incorrect player data showing if multiple players are viewed in quick succession
- [x] Fix overlay not scrolling when the scrolling element is not body
- [x] Fix unavailable profile stats to ready 'n/a' or similar
- [x] Fix display of draft info for players who went undrafted
- [x] Fix further inconsistencies with table styling across sites (test on BBall Ref, 538)
- [x] Fix zero stats showing as n/a?
- [x] Fix previous player's stats sometimes briefly showing
- [x] Fix team name and city reversed!
- [x] Fix close overlay to hide container parent, not remove entirely (should resolve some flicker issues)
- [x] Fix loading graphic sometimes not displaying correctly if quickly hovering over multiple players
- [x] Fix searching mutations that do not alter text content, or not long enough to be names
- [x] Fix infinite loop when treewalker has no next node before last result has been found
- [x] Fix some names not highlighting with current mutation observer filtering
- [x] Fix loading graphic not displaying if same player is selected before previous load finished
- [x] Fix stat display briefly visible without styling when in new scroll parent
- [x] Implement more comprehensive profile photo api, or alternative image sourcing approach
- [x] Handle duplicate player names
- [x] Fix hyphenate surnames leading to invalid image urls
- [x] Fix names with apostrophes leading to invalid image urls
- [x] Fix max width on wider monitors
- [x] Fix scroll bar not adhering to border radius
- [x] Fix vertical white space when players don't have enough seasons to fill the overlay
- [x] Fix horizontal white space when players haven't played a single season yet
- [x] Prevent hovering on same wrapper if overlay still open, to avoid animation stutter
- [x] Fix uneven text styling in player profile
- [x] Fix undefined err if user hovers on player name before frame has properly initialised
- [x] Fix overlay can't be closed while loading
- [x] Handle names that contain other names as a sub-string
- [x] Fix ignore changes from content editable divs - should not add nodes in editable field anyway?
- [x] Fix toggle animating on open popup if extension is active

#### Other

- [x] Fix appear animation direction depending on overlay position
- [ ] Fix inconsistent overlay resize behaviour between user with and without mouse
- [ ] If same as previous player and small stat display height, do not resize, just open to correct height right away
- [ ] Fix overlay positioning when name extends over two lines
- [ ] Fix close button not drawing focus easily because stat overlay is last element
