# Click and Roll

Click and Roll is a browser extension that lets you hover over an NBA player's name on any web page to quickly view their stats. You can [get Click and Roll here](https://chrome.google.com/webstore/detail/click-and-roll/mkindbniefmmhpmcelmkhcpaaieeddml).

## Features

### Hover over any player's name to view their stats in an overlay

Click and Roll highlights a recognised player name in a teal font. Hover over the name to see the player's stats. Here's how it looks in action:

![Click and Roll hover demo](assets/animated/demo1.gif)

Dismiss the overlay by clicking the close button, hovering over a different player's name, or clicking anywhere outside the overlay:

![Click and Roll dismiss demo](assets/animated/demo2.gif)

### Toggle Click and Roll globally or for individual websites

Use the Click and Roll options menu to toggle it on or off, globally or for individual sites:

![Click and Roll toggle demo](assets/animated/demo3.gif)

## Latest Release Notes

1.2.0 Release Notes:

- Moved most important stats (PTS, REB, AST, TOV, BLK, STL) into view without scrolling
- Added ability to reverse career rows, so that career totals and more recent seasons are at the top
- Added metric system heights and weights
- Set stats to only show after hovering on a name for half a second, to prevent accidental openings
- Removed leading zero from percentage stats, for consistency with most stats sites
- Fixed issue where nested names would highlight e.g. Mike Bloom was highlighting within the name Mike Bloomberg
- Fixed issue where un-capped stat window height created huge amounts of white space when viewing players with short careers on very high resolution monitors
- Fixed error when viewing stats for players with no career games (e.g. recently drafted players)
- Other code enhancements

## Future Features

The order and number of features added will depend on user demand. Possible features include:

- Postseason stats
- Season totals
- Per 36 stats
- Advanced stats
- Player accolades/awards in the player profile
- Player bio in the player profile
- Choice of player name highlight colour (including none)
- Dark mode

## Requirements

Chrome version 57 or above is recommended. Older versions will have formatting issues.

## FAQs:

### How many players does Click and Roll cover?

Click and Roll covers over 4500 current and former NBA players.

### How far back does the data go?

Click and Roll's data stretches back all the way to the founding of the Basketball Association of America in 1946. Whether you're interested in George Mikan or Zion Williamson, Click and Roll has you covered.

### How up-to-date is the data?

Click and Roll's database updates every three hours during the season, so it's never too far behind the latest games.

If you notice a player's stats are still out of date after three hours, or some other error in the stats, please [report an issue](https://github.com/aajfranklin/Click-And-Roll/issues).

### How do you find the players' names in each web page?

Click and Roll uses the [Aho-Corasick algorithm](https://en.wikipedia.org/wiki/Aho%E2%80%93Corasick_algorithm) to quickly locate player's names in a website's text content. Version used is [GitHub user BrunoRB's Aho-Corasick implementation for javascript](https://github.com/BrunoRB/ahocorasick), lightly edited with ES6 syntax.

### How does this affect performance?

Click and Roll should not noticeably affect performance during normal usage of most websites. Some slow down may be noticeable when scrolling very quickly through a site with a lot of dynamically loaded content, such as a social media feed.

If you do experience serious performance issues on any site, please toggle Click and Roll off for that site and [report the problem](https://github.com/aajfranklin/Click-And-Roll/issues).

### Why is the player's photo sometimes a placeholder silhouette?

Not all 4500+ players have photos available. The placeholder is a fallback for players without photos.

The placeholder image is [generic person silhouette 16](http://getdrawings.com/generic-person-silhouette#generic-person-silhouette-16.jpg) from [Get Drawings](http://getdrawings.com/).

### What does the star next to some seasons mean?

That means the player played in the All-Star game that season.

### Why do player names sometimes not highlight?

Sometimes you will recognise an NBA player's name, but Click and Roll won't. The name might be:

- Spelled or capitalised wrong on the web page
- Punctuated wrong. Click and Roll is picky - it wants JJ Redick, not J.J. Redick. On the flipside, it wants P.J. Tucker, not PJ Tucker. It all comes down to how the NBA records the player's name.
- A nickname. Click and Roll doesn't recognise nicknames, with a couple of exceptions for Steph Curry and Magic Johnson. If you want to see a new nickname added, submit a feature request!
- Split over multiple html elements, which makes it difficult to recognise. You might notice this when a player's name is split across two lines, or when one part of the name is in bold or italics.

### Why am I getting an error when viewing a player?

This could be for a few reasons:

- Many users viewing players at once, overwhelming the server
- Adverse network conditions on the user's side
- Adverse network conditions on the server's side
- The server is down for maintenance
- Distance from user to the server (the click and roll server is in the UK)
- Other unforeseen problems!

It may be possible to increase the Click and Roll server's capacity and uptime in future. Whether or not that happens will depend on how popular the extension becomes and how affordable those improvements are.

### Who designed the Click and Roll icon?

Two icons by [Freepik](https://www.flaticon.com/authors/freepik) from www.flaticon.com were used to create the Click and Roll icon. They are the [basketball icon](https://www.flaticon.com/free-icon/basketball_167739#term=basketball&page=1&position=2) and [cursor icon](https://www.flaticon.com/free-icon/cursor_99173#term=cursor&page=1&position=3). These were combined and edited to form the final icon.

## Support

Click and Roll is a hobby project developed in my free time. If you enjoy Click and Roll and want to support its ongoing development, consider donating via this [donate link](https://paypal.me/clickandroll).
