# Click And Roll

A chrome extension that lets you hover on an NBA player's name on any web page to quickly view their stats.

## To Do

### Features

- [x] Highlight player names on page load
- [x] Highlight player names in dynamically loaded elements
- [x] Placeholder overlay when hovering player name
- [ ] Fetch data from an open source api on hover
- [ ] Display data in overlay
- [ ] Make overlay dismissable
- [ ] Extension icon
- [ ] User choice of highlight colour (including none)
- [ ] User choice of sites to include/exclude
- [ ] Expand ReadMe with features, credits

### Optimisations

- [ ] Fetch player names from api and store locally on first use
- [ ] Explore possible time-savings for mutation observer implementation to reduce slow down on complex pages

### Fixes

- [ ] Handle duplicate player names
- [ ] Handle names that contain other names as a sub-string
- [x] Fix negative result start offset when part of name has text formatting
- [x] Fix overlay not appearing over other elements
- [x] Fix absolute offset calculation errors when offsetParent does not cascade up to original document body
- [ ] Fix overlay not scrolling when the scrolling element is not body
- [ ] Fix overlay positioning when name extends over two lines
- [x] Fix appear animation direction depending on overlay position
