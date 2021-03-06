# trilaud
Used to be a gifted sub farmer for Twitch.

Twitch backed devs changed something, so  you cannot get gifted subs just by being in a channel 
(or the chance is very low, you are at the end of the list). 

Still, this can be still used as an enterprise-grade sub gift monitoring application with JSON endpoints to interact with
some dank frontend or chatbot Copesen

## Features ##
* Synchronous channel join, respects the [recently enforced ratelimits](https://dev.twitch.tv/docs/irc/guide#authentication-and-join-rate-limits). Join more than 20 channels without issues.
* Optional: play a sound when you get a gift
* Optional: monitor pings (mentions), play a sound in addition if enabled
* Add new channels without restarting using an integrated web interface (all OS') or sending SIGUSR2 (Unix-like OS, will not work on Windows)
* [Free software](https://www.gnu.org/philosophy/free-sw.html) under the [GNU GPL](https://www.gnu.org/licenses/gpl-3.0.html). Bug reports and feature requests are welcome.
* Designed for unattended use. Set it up and forget about it (kinda Okayeg)
* No need to register a dedicated Twitch application for it
* Should run just fine on Windows, OSX and GNU/Linux. On Free and Dragonfly BSD you'll need the alsa utils compatibility package to hear sounds
* Shoult run on other platforms supported by node.js, but without sound playback for now.
* No architecture specifc code I know of. You can run it on your Raspberry PI 24/7! (this is how I use it akshually 🤓) Some people told me they run it from termux from their old Android phones. Farm subs and reduce e-waste today.
* Easy way to run multiple instances so you can run it under multiple usernames

## What does this do? ##
This simple nodejs program joins a bunch of Twitch channels and collects publicly available data about gifted subs (amount, channel and gifters name or anon)
## What doesn't this program do ##
It will not say anything under your name.
## Why does it join channels so slow? forsenY ##
[Twitch limits the rate of how many channels you can join under a given time](https://dev.twitch.tv/docs/irc/guide#authentication-and-join-rate-limits). 
For non-"verified bot" accounts this is 20 channel joins per 10 seconds. The program joins one channel once per at least 580ms, a safe value (roughly 17 joins per 10 seconds). 
From my experience with twitch ratelimits it's best to play safe. To reduce the impact of this (as also mentioned) you can add more channels without restarting. 
Just add the new channels to channels.txt and send SIGUSR2 to the program or use the web interface to start a reload.

## System requirements ##
* NodeJS 10.x LTS
* any OS that can run node 10
* any hardware that can run an OS that can run node 10. Tested and used on 32bit hardfloat ARM and x86
* Internet connection
* 60MB free RAM and 11MB free space (additional free space is required for node and log files of PM2 if used)

## How to use? FeelsDankMan ##
0. Recommended: install git. Linux and BSD users can use their distros' package manager. Windows users can get it from [here](https://gitforwindows.org/) or get it from [Chocolatey](https://community.chocolatey.org/packages/git) 
1. Download or clone the repo **As the program is under constant, development I suggest you clone it using git and update it regularly**
2. Copy config.js.example to config.js
3. Open config.js in a text editor and fill out the config. Instruction are inside
4. create a file called "channels.txt" and fill it with channels you want to be in, one channel per line. Empty and too short lines are ignored
5. Download and install node.js. I develop it on Node 12.xLTS and run it on 10.xLTS, so I recommend using 12.xLTS if you don't use it otherwise
6. Run **npm si** in the project's folder to install the required modules. Of course you can use **npm install** too, however **si** installs the same verisons of packages I have on my dev pc and also in the packages-lock.json, minimizing the chance of incompatibility errors.
7. Run the program with "node triLaud.js"
8. optional: Install the pm2 process manager (https://pm2.keymetrics.io/) and run the program with "pm2 start triLaud.js". pm2 will automatically restart it on case of crashes and errors I can only handle with terminating the application
9. On updates: check the console or config.js.example for added new options that require setup
## http interface ##
triLaud has an integrated web server (nodejs http server based, no additional bloat) for stats and reload option for Windows users. 
If you don't need/don't want this functionality set http port to 0 in the config (or remove the setting).

**On systems that are accessible by other on the network I recommend setting the web server IP address to localhost or setting up firewall rules to prevent unauthorized access**

HTML Endpoints (for humans like us):
* / : stats in html
* /reload : issue a reload command, reply in html
* /stats/channel : Channel stats in html (how many gifts per channel)
* /stats/oilers : Individual gifter stats in html (anons are grouped into one)
* /teapot: Okayga TeaTime


JSON Endpoints (for machines, not for us humans):
* /api/reload : issue a reload command, reply in JSON
* /stats/json: basic stats in json (mem usage is in bytes. Rest speaks for themselves)
* /stats/channel/json: Channel stats in json
* /stats/oilers/json: Individual gifter stats in json (anons are grouped into one)
* /teapot/json: Okayga TeaTime (in JSON, robots like tea too)

Planned:
* /addchannel: add new channel(s) from a HTML form
* /api/addchannel: add new channel(s) using POST

## Running multiple instances ##
1. Create a directory in the programs main dir. The subdirectory "alts" will be ignored by git, I suggest creating alts' directories there
2. Put a config.js and channels.txt inside that dir. Make sure you set up different credentials and if you use http a different port set a different one
3. start the program with the parameters **-d [cfgdir]** 
4. A pid file you can use to send a SIGUSR2 to the new process will be created inside that directory

I didn't really test it, but alts joining channels my affects each others ratelimits. I suggest you start alts after each other and not parallel.

## Changelog ##
* **2021-10-01** I confirmed with high confidence that you cannot farm subs this way. It was a fun ride bois.
* **2021-09-14** Added another JSON endpoint for general stats
* **2021-08-29** Added JSON endpoints for statistics pages.
* **2021-08-25** Fixed an issue where pidfile writing threw a TypeError on node 14+
* **2021-08-23** Added support for running multiple instances
* **2021-08-16** Added donk stats pages (WIP, planned features: better looks, options to order then)
* **2021-08-14** Now counts gifts detected per session, added stats to web interface. Added high quality OC favicon.
* **2021-08-13** Added httpHost variable so integrated server can listen on network.
* **2021-08-12** Added a JSON endpoint (/api/reload) to http server, because we need JSON API in gifted sub farmer NaM
* **2021-08-12** v0.1.2 - PagMan new option and function: http server. Add the new httpPort variable to config then navigate to http://localhost:*port* for a supa simple page for channel stats and reload option for Winfriends. More stats coming soon!
* **2021-08-12** v0.1.1 - Changed reload signal for Unix like OS' from USR1 to USR2, as USR1 is reserved (kinda) by node for the debugger and listening to it may cause issues when ran with the debugger.
* **2021-08-09** New option: colorful output. New dependency: [chalk](https://github.com/chalk/chalk) Report JoinError's only at one place.
* **2021-08-09** Started tracking changes FeelsOkayMan. Version 0.0.1 -> 0.1.1

## Contact ##
You can find me with questions etc. over at https://twitch.tv/noiredayz

## Acknowledgements ##
This program was inspired by https://github.com/zneix/trihard-kkona

Twitch is trademark of Twitch Interactive Inc.
