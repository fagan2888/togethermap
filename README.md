TogetherMap
===========

## A web and mobile app for collaborative mapping

TogetherMap is intended to be the Google Docs-style app for editing and sharing shapefiles.

It utilizes Meteor/Mongo on the backend and the Meteor/Mapbox stack on the font - think web maps backed by a trivial-to-install database and you have the right idea.

It is a work in progress.  It is a side project, and is only tangentially related to my job, so please keep that in mind when making requests.

## User Documentation

User Documentation is available [here](http://fscottfoti.github.io/togethermap_help/).  The most interesting part of that documentation to a Github audience is the discussion of how to [customize](http://fscottfoti.github.io/togethermap_help/customization/) rendering of places in TM, which is definitely a programming exercise (it uses Handlebars.js and Autoform extensively, as well as Javascript functions for theming and access to Meteor/Mongo filters via the interface).

## Why not Postgres?

Let's get this one out of the way right from the start: why not back with a Postgres/Postgis db?  Honestly, for two reasons.  1) Postgres is a bear to install and 2) maintaining schemas across application contexts is an enormous pain.  In my opinion, it's about time for geo to move to the web paradigm = json documents and filters on collections rather than relationships, and do geo analysis in Python.  The day might not be today, but it's coming.  Of course, many important projects are built on Postgis today, so including Postgis connectivity as an option makes a ton of sense (it doesn't yet exist).

## Installation

Installation is simple. 

* First [Install Meteor](https://www.meteor.com/install)
* Second clone this repo
* Third run `meteor` in the cloned repo
* Fourth open up `http://localhost:3000/` in a web browser

## A Note on Meteor

Meteor is amazing JavaScript framework (created by a friend of mine from high school) which allows real time transfer of data from MongoDB to web and mobile clients.  In my opinion, its real strength is to put client and server in the same language, side by side, and to allow data access in both client and server using the same abstractions (which are both based on Mongo).

Perhaps even more importantly, the ease of installation, of managing Javascript packages, and of deployment has really been a godsend for me.  That said, the frontend framework for Meteor, called Blaze, is very clean but perhaps not as powerful or familiar as frameworks like React and Angular.  As Meteor now seems set for a move to React, I think TM might be headed in that direction, but for now everything is in the vanilla Meteor stack.

It should also be noted that almost all tools used in TM are open source and therefore free - this includes everything in Meteor, Mapbox, and TM itself.  The only exceptions are:

* A Mapbox key can be provided in order to access Mapbox basemaps, markers, and a few other items, although it's not required.
* If you want to do more than run locally, deployment must be paid for.  If you have an Amazon EC2 instance you can run on any Ubuntu machine.  I also use a Digital Ocean instance for $5/month and a MongoDB instance at compose.io for about $18/month, so deployment cost is modest.  Really anything that supports deployment of Meteor apps should work.
* Filepicker.io is used to manage images in TM, and is a wonderful tool to allow connectivity to lots of cloud based storage providers.  They keep raising their prices and it's now up to $99/month for any substantive use, so it's almost certainly on its way out of TM.

## Meteor/Mongo Data Schema

There are currently four Meteor/Mongo collections.

Let's get one terminology issue out of the way up front.  Collections in TogetherMap are a set of places that embody a common theme, similar to a layer in GIS (e.g. States in the United States).  Collections in MongoDB are sets of JSON documents.  All places in every TogetherMap collection are stored in a single MongoDB collection called Places.  There is also a MongoDB collection called Collections which describes settings for each TogetherMap collection.  This is subject to change in the future, but I just like the term "collection" more than "layer" inside of TogetherMap.  In almost every place in this documentation I think the intended use of the word collection is fairly obvious, but this section is undoubtably confusing and lame.  Bear with me.

* Collections - The Collections collection stores a single document per TM collection which configures that collection, and includes information like name, description, the user who created the collection, number of places in the collection, and information on how to theme the collection.
* Places - places are geojson objects which store your spatial data.  That's right, all shapes are in the same collection.  Many millions of them if you want.  Filter on the collectionId attribute (which relates to the _id attribute in the Collections collection) to access all the places for a TM collection.
* Followed - a set of documents which keeps track of which collections a user is following.  This could probably by user data (i.e. in the Meteor Users collection), but it's not right now.
* Comments - a set of documents which keep track of the comments on a given place using the placeId attribute (which relates to the _id attribute in the Places collection).

## Vision for Future Work

* Mobile app - although you can go to a TM website and use it perfectly well on any mobile device, releasing a mobile app in the app stores has not been done yet.  Meteor is designed to deploy to Android and IOS and I have successfully prototyped this, but a small amount of cleanup is still required for an initial release.
* Mapbox.js - TM now supports being able to serve Mapbox Vector Tiles in compressed format and with caching on the server.  Initial prototypes show that Mapbox GL (a WebGL library) can take these tiles from TM and render 10s of thousands of shapes with no lag.  This is clearly the future of TM (and web mapping in general) and I look forward to integrating more tightly with TM collection configuration options.
* I work closely with city and regional land use and transportation planners (I'm current employed by MTC in the Bay Area).  As such my primary use case is to visualize parcels shapes and attach zoning attributes to those shapes.  The main functionality here is just being able to join a second csv file to a collection of shapes, and this is a common operation in GIS too.  This isn't supported yet in TM but should be soon.
* Along those lines, I use TM to do a ton of visualizations for analyses that I perform on where future real estate developments are likely to be located (based on current markets and some addtional forecasting).  I will continue to improve the workflow to get TM data into Python for analysis and then into TM for visualization and feedback.  In the future I can imagine adding interactive charting of collection attirbutes similar to the [UrbanLayers](http://io.morphocode.com/urban-layers/) demo.

## Loading Sample Data

## Other fun Python scripts

## Layout of directories

The layout of directories in TM is similar to most other Meteor apps.  There's a client directory which is full of templates and controllers for rendering various components of TM, and there's a server directory which contains all Meteor publications of Mongo data.  There's a "both" directory which contains global settings accessible in both client and server, connectors to a few data sources, etc.  Finally, there's a scripts directory which contains Python scripts for getting data into and out of TM, and probably some more interesting demos in the future.

## Note on Testing

Yup, there's no tests.  I'm not, like, against tests or anything, I just don't require a 24/7 always-on app for my work.  I'd love to have the justification to start writing tests, but need to find out if anyone will use the app first before spending my nights and weekends building a bulletproof app that no one uses.  If you want tests, don't get uptight or mean, just open an issue and/or do the usual "+1" voting.  Or better yet, pitch in.
