# Click And Roll

A chrome extension that lets you click on an NBA player's name on any web page to quickly view their stats.

## To Do

### Features

- [x] Highlight player names on page load
- [x] Highlight player names in dynamically loaded elements
- [ ] Placeholder popup window when clicking player name
- [ ] Fetch data from an open source api on click
- [ ] Display data in popup window
- [ ] Extension icon
- [ ] User choice of highlight colour (including none)
- [ ] User choice of sites to include/exclude

### Optimisations

- [ ] Fetch player names from api and store locally on first use
- [ ] Explore possible time-savings for mutation observer implementation to reduce slow down on complex pages

### Fixes

- [ ] Handle duplicate player names
- [ ] Handle names that contain other names as a sub-string
- [x] Fix negative result start offset when part of name has text formatting
- [x] Fix overlay not appearing over other elements
- [ ] Fix absolute offset calculation errors when offsetParent does not cascade up to original document body
