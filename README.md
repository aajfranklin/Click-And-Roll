# DISCONTINUATION

As of September 2023, Click and Roll is no longer published on any browser extension stores and the Click and Roll data server is no longer running. This is due to a lack of donations to cover the running costs of the Click and Roll server. As a more experienced developer this is no longer the key portfolio piece it once was, so I can't justify keeping it running at a recurring cost to my wallet.

Thank you to the ~1,500 monthly users of Click and Roll for finding value in this work - I sincerely hope it was useful! This was a fun and challenging project for me as an early-career web developer when I kicked it off, and I look back on it fondly.

# Click and Roll

Click and Roll is a free browser extension for getting NBA stats anywhere. Hover over any NBA player's name on any web page to quickly view their stats.

- [Installation](#installation)
- [Features](#features)
- [Changelog](#changelog)
- [FAQ](#faq)
- [Donations](#donations)

## Installation

| Browser | Recommended Version | Store Link                                                                                                                     |
| ------- | :-----------------: | ------------------------------------------------------------------------------------------------------------------------------ |
| Chrome  | 57+                 | [Click and Roll - Chrome Web Store](https://chrome.google.com/webstore/detail/click-and-roll/mkindbniefmmhpmcelmkhcpaaieeddml) |
| Firefox | 68+                 | [Click and Roll - Firefox Add-Ons](https://addons.mozilla.org/en-GB/firefox/addon/click-and-roll/)                             |
| Edge    | 89+                 | [Click and Roll - Edge Add-Ons](https://microsoftedge.microsoft.com/addons/detail/edijdhnfekmllaeppcecmmoabggpdana)            |
| Opera   | 44+                 | [Click and Roll - Chrome Web Store](https://chrome.google.com/webstore/detail/click-and-roll/mkindbniefmmhpmcelmkhcpaaieeddml) |

Opera users should add the [Install Chrome Extensions Opera Add-On](https://addons.opera.com/en/extensions/details/install-chrome-extensions/) before installing Click and Roll.

## Features

- Hover over any player's name to view their stats and profile
- View both regular season and postseason stats
- Toggle Click and Roll on/off globally or for individual sites
- Set the order of career rows (first-to-last or last-to-first)
- Light and dark modes

Click below for a video demo:

[![Click and Roll video demo](assets/static/Thumbnail%20-%20README.jpg)](http://www.youtube.com/watch?v=IuO4YWIEzAk)

Possible future features include:

- Season totals
- Per 36 stats
- Advanced stats
- Player accolades/awards in the player profile
- Player bio in the player profile
- Choice of player name highlight colour (including none)

## Changelog

2.1.0:

- Added site list management and option to use listed sites as either a whitelist or a blacklist
- Improved speed of highlighting names on initial page load

2.0.0:

- Support for Firefox, Opera, and Edge
- Added post season stats tab
- Added dark mode
- Fixed an issue with viewing stats for players with no career games

For earlier changes, see the [releases page](https://github.com/aajfranklin/Click-And-Roll/releases).

## FAQ:

#### How many players does Click and Roll cover?

Click and Roll covers over 4500 current and former NBA players.

#### How far back does the data go?

Click and Roll's data stretches back all the way to the founding of the Basketball Association of America in 1946. Whether you're interested in George Mikan or Zion Williamson, Click and Roll has you covered.

#### How up-to-date is the data?

Click and Roll's database updates every three hours during the season, so it's never too far behind the latest games.

If you notice a player's stats are still out of date after three hours, or some other error in the stats, please [report an issue](https://github.com/aajfranklin/Click-And-Roll/issues).

#### How do you find the players' names in each web page?

Click and Roll uses the [Aho-Corasick algorithm](https://en.wikipedia.org/wiki/Aho%E2%80%93Corasick_algorithm) to quickly locate player's names in a website's text content. Version used is [GitHub user BrunoRB's Aho-Corasick implementation for javascript](https://github.com/BrunoRB/ahocorasick), lightly edited with ES6 syntax.

#### How does this affect performance?

Click and Roll should not noticeably affect performance during normal usage of most websites. Some slow down may be noticeable when scrolling very quickly through a site with a lot of dynamically loaded content, such as a social media feed.

If you do experience serious performance issues on any site, please toggle Click and Roll off for that site and [report the problem](https://github.com/aajfranklin/Click-And-Roll/issues).

#### Why is the player's photo sometimes a placeholder silhouette?

Not all 4500+ players have photos available. The placeholder is a fallback for players without photos.

The placeholder image is [generic person silhouette 16](http://getdrawings.com/generic-person-silhouette#generic-person-silhouette-16.jpg) from [Get Drawings](http://getdrawings.com/).

#### What does the star next to some seasons mean?

That means the player played in the All-Star game that season.

#### Why do player names sometimes not highlight?

Sometimes you will recognise an NBA player's name, but Click and Roll won't. The name might be:

- Spelled or capitalised wrong on the web page
- Punctuated wrong. Click and Roll is picky - it wants JJ Redick, not J.J. Redick. On the flipside, it wants P.J. Tucker, not PJ Tucker. It all comes down to how the NBA records the player's name.
- A nickname. Click and Roll doesn't recognise nicknames, with a couple of exceptions for Steph Curry and Magic Johnson. If you want to see a new nickname added, submit a feature request!
- Split over multiple html elements, which makes it difficult to recognise. You might notice this when a player's name is split across two lines, or when one part of the name is in bold or italics.

#### Why am I getting an error when viewing a player?

This could be for a few reasons:

- Many users viewing players at once, overwhelming the server
- Adverse network conditions on the user's side
- Adverse network conditions on the server's side
- The server is down for maintenance
- Distance from user to the server (the click and roll server is in the UK)
- Other unforeseen problems!

It may be possible to increase the Click and Roll server's capacity and uptime in future. Whether or not that happens will depend on how popular the extension becomes and how affordable those improvements are.

#### Who designed the Click and Roll icon?

The Click and Roll icon combines the [basketball](https://www.flaticon.com/free-icon/basketball_167739#term=basketball&page=1&position=2) and [cursor](https://www.flaticon.com/free-icon/cursor_99173#term=cursor&page=1&position=3) icons by [Freepik](https://www.flaticon.com/authors/freepik) from www.flaticon.com. 

## Donations

Click and Roll is developed and maintained as a hobby project. If you enjoy Click and Roll and want to support its ongoing development, please consider making a donation.
 
[![PayPal Donate Button](assets/static/PayPal%20Button.png)](https://paypal.me/clickandroll)
