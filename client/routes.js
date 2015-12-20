Router.configure({
    layoutTemplate: 'layout',
    loadingTemplate: 'loading',
    waitOn: function() {
        return [
            Meteor.subscribe('collections'),
            Meteor.subscribe('collectionsUser')
        ]
    }
});


var getLoadedCids = function () {
    // I'm not entirely sure I need permissions for all loaded collections
    // in principal - if you have been given *special* permissions, you're
    // supposed to be following the collection - otherwise you get the same
    // public permissions that are always sent back with the collection object
    // var mine = MCollections.find().fetch();
    var followed = MFollowed.find().fetch();
    return _.map(followed, function (c) {
        return c.cid || c._id; // can be followed or owned
    });
};


Tracker.autorun(function () {
    Meteor.subscribe("userData");
    Meteor.subscribe("followed");

    var cids = getLoadedCids();
    Meteor.subscribe("permissionsForCid", cids);
});


var verifyPermissions = function (that ,cid) {
    if(readPermission(Meteor.user(), cid)) {
        that.next()
    } else {
        that.render('permission_denied');
    }
};

var waitOn = function (cid) {
    return [
        Meteor.subscribe("collection", cid),
        Meteor.subscribe("permissionsForCid", cid)
    ]
};


Router.map(function () {


    this.route('home', {
        path: '/',
        onAfterAction: function () {
            switchCollection();
            openSidebar();
        }
    });


    this.route('collections', {
        data: function () {
            return {
                collections: MCollections.find(
                    { name: { $ne: 'NEW COLLECTION' } },
                    { sort: { place_count: -1 }}
                )
            }
        },
        onAfterAction: function () {
            switchCollection('collections');
            openSidebar();
        }
    });


    this.route('collection', {
        path: '/collection/:_id',
        waitOn: function () {
            return waitOn(this.params._id);
        },
        data: function () {
            return {
                collection: MCollections.findOne(this.params._id),
                permission: MPermissions.findOne(this.params._id)
            }
        },
        onBeforeAction: function () {
            verifyPermissions(this, this.params._id);
        },
        onAfterAction: function () {
            switchCollection(this.params._id);
            openSidebar();
        }
    });


    this.route('recent', {
        path: '/recent/:_id',
        waitOn: function () {
            return waitOn(this.params._id);
        },
        subscriptions: function () {
            return [
                Meteor.subscribe('posts', undefined, this.params._id),
                Meteor.subscribe('places', this.params._id, undefined, {createDate: -1}, RECENT_LIMIT),
                Meteor.subscribe('comments', undefined, this.params._id)
            ]
        },
        data: function () {
            return {
                collection: MCollections.findOne(this.params._id),
                recent_places: MPlaces.find({collectionId: this.params._id}, {sort: {createDate: -1}, limit: RECENT_LIMIT}),
                recent_posts: MPosts.find({collectionId: this.params._id}, {$sort: {createDate: -1}, limit: RECENT_LIMIT}),
                recent_comments: MComments.find({collectionId: this.params._id}, {$sort: {createDate: -1}, limit: RECENT_LIMIT})
            }
        },
        onBeforeAction: function () {
            verifyPermissions(this, this.params._id);
        },
        onAfterAction: function () {
            switchCollection(this.params._id);
            openSidebar();
        }
    });


    this.route('permissions', {
        path: '/permissions/:_id',
        waitOn: function () {
            return [
                Meteor.subscribe('fullCollection', this.params._id)
            ]
        },
        data: function () {
            return {
                collection: MCollections.findOne(this.params._id)
            }
        },
        onAfterAction: function () {
            switchCollection(this.params._id);
            openSidebar();
        }
    });


    this.route('permissions_link', {
        path: '/permissions_link/:_id/:type/:key',
        waitOn: function () {
            return [
                Meteor.subscribe('collectionViaKey',
                    this.params._id, this.params.key),
                Meteor.subscribe("permissionsForCid", this.params._id)
            ]
        },
        data: function () {
            return {
                params: this.params,
                collection: MCollections.findOne(this.params._id),
                permissions: MPermissions.findOne(this.params._id)
            }
        },
        onAfterAction: function () {
            switchCollection();
            openSidebar();
        }
    });


    this.route('collection_edit', {
        path: '/collection_edit/:_id',
        data: function () {
            return {
                collection: MCollections.findOne(this.params._id)
            }
        },
        waitOn: function () {
            return waitOn(this.params._id);
        },
        onBeforeAction: function () {
            verifyPermissions(this, this.params._id);
        },
        onAfterAction: function () {
            switchCollection(this.params._id);
            openSidebar();
        }
    });


    this.route('profile', {
        path: '/profile/:_id',
        subscriptions: function () {
            return [
                Meteor.subscribe('userData', this.params._id)]
        },
        data: function () {
            return {
                userId: this.params._id,
                profile: Meteor.users.findOne(this.params._id),
                places: MPlaces.find({creatorUID: this.params._id})
            }
        },
        onAfterAction: function () {
            Session.set('active_user', this.params._id);
            switchCollection('profile');
            openSidebar();
        }
    });


    this.route('place', {
        path: '/place/:_cid/:_id',
        subscriptions: function () {
            return [
                Meteor.subscribe('allCollectionsForPlace', this.params._id),
                Meteor.subscribe('posts', this.params._id, this.params._cid)
            ]
        },
        data: function () {
            if(this.ready()) {
                var id = this.params._id;
                var p = MPlaces.findOne(id);
                if(!p) {
                    // place has been deleted
                    return;
                }
                var pid = p.parent_id || p._id;
                return {
                    place: p,
                    posts: MPosts.find({placeId: id}),
                    allPlaceInstances: MPlaces.find({$or: [{_id: pid}, {parent_id: pid}]})
                }
            }
        },
        waitOn: function () {
            var a = waitOn(this.params._cid);
            // wait on the place too so I can use it in the filter above
            a.push(Meteor.subscribe('place', this.params._id, this.params._cid));
            return a;
        },
        onBeforeAction: function () {
            verifyPermissions(this, this.params._cid);
        },
        onAfterAction: function () {
            Session.set('active_place', this.params._id);
            switchCollection(this.params._cid);
            openSidebar();
        }
    });


    this.route('place_edit', {
        path: '/place_edit/:_cid/:_id',
        subscriptions: function() {
            return Meteor.subscribe('place', this.params._id, this.params._cid);
        },
        data: function () {
            return {
                place: MPlaces.findOne(this.params._id)
            }
        },
        waitOn: function () {
            return waitOn(this.params._cid);
        },
        onBeforeAction: function () {
            verifyPermissions(this, this.params._cid);
        },
        onAfterAction: function () {
            Session.set('active_place', this.params._id);
            switchCollection(this.params._cid);
            openSidebar();
        }
    });


    this.route('post', {
        path: '/post/:_cid/:_id',
        subscriptions: function() {
            return [
                Meteor.subscribe('post', this.params._id, this.params._cid),
                Meteor.subscribe('comments', this.params._id, this.params._cid)
            ]
        },
        data: function () {
            return {
                post: MPosts.findOne(this.params._id),
                comments: MComments.find({postId: this.params._id})
            }
        },
        waitOn: function () {
            return waitOn(this.params._cid);
        },
        onBeforeAction: function () {
            verifyPermissions(this, this.params._cid);
        },
        onAfterAction: function () {
            switchCollection(this.params._cid);
            openSidebar();
        }
    });


    this.route('post_edit', {
        path: '/post_edit/:_cid/:_id',
        subscriptions: function() {
            return [
                Meteor.subscribe('post', this.params._id, this.params._cid)
            ]
        },
        data: function () {
            return {
                post: MPosts.findOne(this.params._id)
            }
        },
        waitOn: function () {
            return waitOn(this.params._cid);
        },
        onBeforeAction: function () {
            verifyPermissions(this, this.params._cid);
        },
        onAfterAction: function () {
            switchCollection(this.params._cid);
            openSidebar();
        }
    });


    this.route('search', {
        path: '/search',
        subscriptions: function() {
            return [
            ]
        },
        data: function () {
            return {
            }
        },
        onAfterAction: function () {
            switchCollection();
            openSidebar();
        }
    });


    // this is a non-route route.  Because iron router doesn't open the
    // sidebar when you go back to the route a second time, I'm going to
    // try going to this route (the map route) when closing the sidebar so
    // you can go back to any route that matters (i.e. it will open the
    // sidebar when you do something twice
    this.route('map', {
        path: '/map/:_id',
        data: function () {
            return {
                collection: MCollections.findOne(this.params._id)
            }
        },
        waitOn: function () {
            return waitOn(this.params._id);
        },
        onBeforeAction: function () {
            verifyPermissions(this, this.params._id);
        },
        onAfterAction: function () {
            if(this.params._id == "empty")
                Map.switchBaseLayer(Map.defaultBaseMap);
            switchCollection(this.params._id);
            closeSidebar();
        }
    });
});


var currentCollection;
templates = {};
var sidebarOpen;


openSidebar = function () {
    sidebarOpen = true;
    if(Map.map) {
        Map.sidebar.show();
    }
};


closeSidebar = function () {
    sidebarOpen = false;
    if(Map.map) {
        Map.sidebar.hide();
    }
};


var connectors = {
    'profile': ProfileConnector,
    'collections': CollectionsConnector,
    'picasa': PicasaConnector,
    'flickr': FlickrConnector
};

switchCollection = function (cid) {

    Session.set('active_collection', cid);

    if(cid in connectors) {
        var conn = connectors[cid];
        cid = undefined;
    }

    if(!Meteor.userId()) {
        // if logged out
        Map.removeDrawControl();
    }

    if(!Map.map) {
        return;
    }

    if(sidebarOpen) {
        // yes I get that this is weird, but when you refresh, we
        // open the sidebar before the map is initialized so we
        // need to store the state and open when we initialize
        openSidebar();
    }

    if(!cid) {
        if(currentCollection) {
            Map.newShapes();
            FlickrConnector.remove();
            Map.removeDrawControl();
            currentCollection = undefined;
        }

        if(!Map.activeBaseMap) {
            Map.switchBaseLayer(Map.defaultBaseMap);
        }

        if(conn) {
            // custom data connector

            templates.place_template = Handlebars.compile(defaultPlaceTemplate);
            templates.place_template_list = Handlebars.compile(defaultPlaceTemplateList);

            conn.init();
            conn.getAll();
        }

        return;
    }

    var c = MCollections.findOne(cid);

    if(!c) {
        if(!Map.activeBaseMap) {
            //Map.switchBaseLayer(Map.defaultBaseMap);
        }
        return;
    }

    if(cid != currentCollection) {

        currentCollection = cid;

        DefaultMapDriver.init(cid, c);

        Map.newShapes();
        FlickrConnector.remove();

        if(c.flickr_link) {
            FlickrConnector.init(c.flickr_link);
        }

        templates.place_template = Handlebars.compile(
            c.place_template || defaultPlaceTemplate);

        templates.place_template_list = Handlebars.compile(
            c.place_template_list || defaultPlaceTemplateList);

    }

    // this needs to be outside of the if statement above so it
    // will run every time a person logs in or out
    if(!mobileFormFactor &&
        writePermission(undefined, cid, Meteor.user(), 'place')) {
        Map.addDrawControl();
    } else {
        Map.removeDrawControl();
    }

    if(!c.disable_geoindex) {
        var poly = Map.getBoundsAsPolygon();
    }
    Meteor.subscribe("places", cid, poly, {
        onReady: function() {
            DefaultMapDriver.maybeSetLocation();
            var cnt = Map.countVisiblePlaces();
            Session.set('map_visible_places', cnt);
        }
    });
    DefaultMapDriver.getAll(cid);
};