# Click And Roll

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
- [ ] Add career totals, averages
- [ ] Add current season averages for pts, ast, reb, blk, stl for active players
- [x] Add player pic, with placeholder if unavailable
- [x] Add basic player info
- [ ] Loading message while fetching data
- [ ] User-friendly error messages
- [ ] Extension icon
- [ ] Expand ReadMe with features, credits

#### Other

- [ ] Add player text profile
- [ ] Add last game for active players
- [ ] User choice of highlight colour (including none)
- [ ] User choice of sites to include/exclude
- [ ] User choice of dynamic highlighting

### Optimisations

#### MVP

- [x] Fetch player names from api and store locally on first use
- [x] Store most recently viewed player id and do not repeat API call if user scrolls over same player

#### Other

- [ ] Explore possible time-savings for mutation observer implementation to reduce slow down on complex pages
- [ ] Store number of times each player has been viewed, store stats of most viewed players

### Fixes

#### MVP

- [ ] Handle duplicate player names
- [ ] Handle names that contain other names as a sub-string
- [x] Fix negative result start offset when part of name has text formatting
- [x] Fix overlay not appearing over other elements
- [x] Fix absolute offset calculation errors when offsetParent does not cascade up to original document body
- [x] Fix unavailable stats to display 'n/a' or similar
- [x] Fix overlay sometimes not closing correctly
- [ ] Implement more comprehensive profile photo api, or alternative image sourcing approach
- [x] Fix close button sometimes not centered properly
- [x] Fix issue when current node has no parent node while locating matches

#### Other

- [x] Fix appear animation direction depending on overlay position
- [ ] Fix overlay positioning when name extends over two lines
- [ ] Fix close button not drawing focus easily because stat overlay is last element
