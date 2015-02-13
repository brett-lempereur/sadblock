# Sadblock

The loneliest ad-blocker in the world.

## Why

This started as a joke after I sat on the sidelines during a heated discussion about the ethics of using ad-blocking software, and had no strong opinion on the matter.  An impasse was reached that perhaps, just perhaps, an extension that prevented a user from viewing content _as well as_ advertising might be more ethically palatable.

Things are a little bit temperamental right now, but they'll probably improve over time.

## How

This is a barely modified version of AdBlock that blocks content _and_ advertising.  Over time the code will diverge more from the AdBlock base.  With a little more work I'll be using a Shadow DOM to avoid redirecting to the extension web content page.  This will also give the user the option to "whitelist" the site for both content and advertising.

I don't expect this to be so widely used.  People tend to either prefer to block adverts, or to allow everything, and I've never seen much of an attempt at anything else.  But still, it's an interesting experiment to try and get consumers and producers of content to meet in the middle. 

## Todo

Help with any of these things would be appreciated:

1. Replace AdBlock branding with Sadblock branding.
2. Have somebody that cares enough write a manifesto for the blocking page.
3. Rip out most of the guts of AdBlock except for the minimal functionality needed, in particular the really sketchy unique identification stuff.
4. Allow users to view a page by agreeing to permit it to advertise and track.
5. Localise content-blocking page/manifesto.

I'm also acutely aware that the CSS-selector based blocking is somewhat inefficient; this will be fixed when I figure a better way to do it.

## Installation

Sadblock *is not ready* to be uploaded to the Chrome Web Store, but it can be installed by hand if you're particularly brave:

1. Clone the repository from GitHub.
2. Enable "Developer Mode" in the Google Chrome extensions configuration page.
3. Select "Load unpacked extension...".
4. Browse to the location where you cloned the repository.

I haven't had time to implement support for Safari yet, but it'll happen.

## Thanks

With thanks (and apologies) to the [AdBlock](https://getadblock.com/) team.

