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
- [ ] Make overlay dismissable
- [ ] Make data readable
- [ ] User-friendly error messages
- [ ] Extension icon
- [ ] User choice of highlight colour (including none)
- [ ] User choice of sites to include/exclude
- [ ] User choice of dynamic highlighting
- [ ] Expand ReadMe with features, credits

#### Other

### Optimisations

#### MVP

- [x] Fetch player names from api and store locally on first use
- [ ] Cache most recently viewed player(s) and do not repeat API call if player is in cache

#### Other

- [ ] Explore possible time-savings for mutation observer implementation to reduce slow down on complex pages

### Fixes

#### MVP

- [ ] Handle duplicate player names
- [ ] Handle names that contain other names as a sub-string
- [x] Fix negative result start offset when part of name has text formatting
- [x] Fix overlay not appearing over other elements
- [x] Fix absolute offset calculation errors when offsetParent does not cascade up to original document body

#### Other

- [x] Fix appear animation direction depending on overlay position
- [ ] Fix overlay not scrolling when the scrolling element is not body
- [ ] Fix overlay positioning when name extends over two lines
