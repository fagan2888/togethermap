Router.configure({
    layoutTemplate: 'layout',
    loadingTemplate: 'loading',   
    waitOn: function() {
        return [
            Meteor.subscribe('collectionsUser'),
            Meteor.subscribe('collections')
        ]
    },
});


var userDocHandle = {
    ready: function () {
        if(!Accounts.loginServicesConfigured())
            return false;
        if(Meteor.loggingIn()) {
            return false;
        }
        return true;
  }
};


var waitOn = function (cid) {
    return [
        Meteor.subscribe("collection", cid, {
            onReady: function (c) {
                if (!c && !Map.activeBaseMap) {
                    Map.switchBaseLayer(Map.defaultBaseMap);
                }
            }
        }),
        Meteor.subscribe("permissionsForCid", cid)
    ]
};


var verifyPermissions = function (that, cid) {
    if(connectors[cid]) {
        that.next();
        return;
    }

    if(cid == "empty" || readPermission(Meteor.user(), cid)) {
        that.next()
    } else {
        that.render('permission_denied');
    }
};


Router.map(function () {


    /*this.route('email', {
        where: 'server',
        path: '/email/:_id',
        action: function() {
            var data = recentPlacesDataByUser(this.params._id);
            var html = Handlebars.templates['recent'](data);
            html = buildTemplate(html);
            this.response.writeHead(200, {'Content-Type': 'text/html'});
            this.response.write(html);
            this.response.end();

            //Meteor.call(
            //    "sendEmail",
            //    "Fletcher <fletcher@togethermap.com>",
            //    "TogetherMap <info@togethermap.com>",
            //    "Yesterday's News from TogetherMap",
            //    html
            //);
        }
    });*/


    this.route('home', {
        path: '/',
        onAfterAction: function () {
            if(Meteor.user()) {
                Router.go('collections');
            } else {
                Router.go('gallery');
            }
        }
    });


    this.route('login', {
        path: '/login',
        onAfterAction: function () {
            openSidebar();  
        }
    });


    this.route('about', {
        onAfterAction: function () {
            $.fancybox( renderTmp(Template.landing) );
            Router.go('collections');
        }
    });


    var makeMyCollectionsFilter = function () {
        var followedIdsFilter = {_id: {$in: getFollowedCids()}};
        var uidFilter = userIdExpression(getUser(Meteor.user()));
        return {$or: [followedIdsFilter, uidFilter]};
    }


    this.route('collections', {
        data: function () {
            return {
                heading: 'My Collections',
                followedIds: getFollowedCids(),
                collections: MCollections.find(
                    makeMyCollectionsFilter(),
                    { sort: { createDate: -1}}
                )
            }
        },
        onAfterAction: function () {
            CollectionsConnector.filter = makeMyCollectionsFilter();
            switchCollection('collections');
            openSidebar();
        },
        unload: function () {
            Map.enable_clustering = false;
            $('.tooltipped').tooltip('remove');
        }
    });


    this.route('gallery', {
        template: 'collections',
        data: function () {
            return {
                heading: 'Gallery',
                followedIds: getFollowedCids(),
                collections: MCollections.find(
                    {gallery: true},
                    { sort: { createDate: -1}}
                )
            }
        },
        waitOn: function() {
            return [
            ]
        },
        onAfterAction: function () {
            CollectionsConnector.filter = {gallery: true};
            switchCollection('gallery');
            openSidebar();
        }
    });


    this.route('collection', {
        path: '/collection/:_id',
        waitOn: function () {
            Session.set('noNav', Session.get('noNav') || this.params.query.noNav);
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
            Map.normalOtherPlaces();
            switchCollection(this.params._id);
            openSidebar();
        },
        unload: function () {
             $('.tooltipped').tooltip('remove');
        }
    });


    this.route('recent', {
        path: '/recent/:_id',
        waitOn: function () {
            return waitOn(this.params._id);
        },
        subscriptions: function () {
            return [
                Meteor.subscribe('places', this.params._id, undefined, {createDate: -1}, RECENT_LIMIT),
                Meteor.subscribe('comments', undefined, this.params._id)
            ]
        },
        data: function () {
            return {
                collection: MCollections.findOne(this.params._id),
                recent_comments: MComments.find({collectionId: this.params._id}, {$sort: {createDate: -1}, limit: RECENT_LIMIT})
            }
        },
        onBeforeAction: function () {
            verifyPermissions(this, this.params._id);
        },
        onAfterAction: function () {
            switchCollection(this.params._id);
            openSidebar();
        },
        unload: function () {
             $('.tooltipped').tooltip('remove');
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
            if(this.data().collection &&
                this.data().collection.read_loginreq != true &&
                this.params.type == "readers") {
                // if it's not login required, by definition we want to just
                // give access to the collection - no funny business
                Router.go("collection",
                    {_id: this.params._id});
            }
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
        },
        unload: function () {
            $('.tooltipped').tooltip('remove');
        }
    });


    this.route('/geojson/:_cid/:z/:x/:y', function () {
        /* return geojson formatted shapes for the given x y and z
           note this needs to be verified for permissions!! */

        var x = parseInt(this.params.x);
        var y = parseInt(this.params.y);
        var z = parseInt(this.params.z);
        var w = tile2long(x, z);
        var e = tile2long(x+1, z);
        var n = tile2lat(y, z);
        var s = tile2lat(y+1, z);

        var filter = { bbox : 
            { '$geoIntersects' :
              { '$geometry' :
                {
                  "type": "Polygon",
                  "coordinates": [[ [w,s] , [w,n], [e,n], [e,s], [w,s] ]]
                }
        } } };

        filter.collectionId = this.params._cid;

        var places = MPlaces.find(filter, {limit: 2000}).fetch();

        var json = {"type": "FeatureCollection", "features": places};

        this.response.setHeader( 'access-control-allow-origin', '*' );
        this.response.setHeader('Content-Type', 'application/json');
        this.response.end(JSON.stringify(json));

    }, {where: 'server'});


    this.route('place', {
        path: '/place/:_cid/:_id',
        subscriptions: function () {
            return [
                Meteor.subscribe('comments', this.params._id, this.params._cid),
                Meteor.subscribe('place', this.params._id, this.params._cid)
            ]
        },
        data: function () {
            if(this.ready()) {

                Map.highlightPlace(this.params._id);

                var id = this.params._id;
                var cid = this.params._cid;

                var p = connectors[cid] ?
                    connectors[cid].getOne(id) :
                    MPlaces.findOne(id);

                if(Session.get('activeConnector') && Session.get('results_ready')) {
                     p = connectors[Session.get('activeConnector')].getOne(this.params._id);
                }

                if(!p) {
                    // place has been deleted
                    return;
                }

                if(!Map.placeIsVisible(p)) Map.goToPlace(p, true, true);

                var pid = p.parent_id || p._id;

                return {
                    place: p,
                    comments: MComments.find({placeId: id}, {sort: {createDate: +1}}),
                    allPlaceInstances: MPlaces.find({$or: [{_id: pid}, {parent_id: pid}]})
                }
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
            Session.set('disableHover', true);
            Session.set('dont_set_collection_location', true);
            switchCollection(this.params._cid);
            openSidebar();
        },
        unload: function () {
            Map.unHighlightPlace(this.params._id);
            Session.set('disableHover', false);
            Session.set('dont_set_collection_location', false);
            $('.tooltipped').tooltip('remove');
        }
    });


    this.route('place_edit', {
        path: '/place_edit/:_cid/:_id',
        subscriptions: function() {
            return Meteor.subscribe('place', this.params._id, this.params._cid);
        },
        data: function () {
            if(this.ready()) {
                var p = MPlaces.findOne(this.params._id);
                // we only want to move the map the first time we see the
                // place - I mean, not when we go from the place to place_edit
                // route for the same place, for instance
                if(p && Session.get('active_place') != this.params._id) {
                    Map.goToPlace(p, true, true);
                    Map.highlightPlace(this.params._id);
                    Session.set('active_place', this.params._id);
                }
            }
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
            Session.set('disableHover', true);
            switchCollection(this.params._cid);
            openSidebar();
        },
        unload: function () {
            Session.set('disableHover', false);
            $("#shape-color").spectrum("hide");
            $('.tooltipped').tooltip('remove');
        }
    });


    this.route('search', {
        path: '/search',
        onAfterAction: function () {
            Session.set('queryString', undefined);
            Session.set('query_valid', true);
            switchCollection('home');
            openSidebar();
        },
        onStop: function () {
            Session.set('query_valid', false);
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
            Session.set('noNav', Session.get('noNav') || this.params.query.noNav);
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


AccountsTemplates.configure({
    //defaultLayout: 'emptyLayout',
    showForgotPasswordLink: true,
    overrideLoginErrors: true,
    enablePasswordChange: true,
    sendVerificationEmail: false,

    //enforceEmailVerification: true,
    //confirmPassword: true,
    //continuousValidation: false,
    //displayFormLabels: true,
    //forbidClientAccountCreation: false,
    //formValidationFeedback: true,
    //homeRoutePath: '/',
    //showAddRemoveServices: false,
    //showPlaceholders: true,

    negativeValidation: true,
    positiveValidation:true,
    negativeFeedback: false,
    positiveFeedback:false,

    // Privacy Policy and Terms of Use
    //privacyUrl: 'privacy',
    //termsUrl: 'terms-of-use',
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


connectors = {
    'home': SearchConnector,
    'gallery': CollectionsConnector,
    'collections': CollectionsConnector
};

switchCollection = function (cid) {

    Session.set('activeCollection', cid);

    if(!Meteor.userId()) {
        // if logged out
        Map.removeDrawControl();
    }

    if('collections' || 'gallery') {
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

    if(cid in connectors) {

        if(cid == currentCollection)
            return;

        Session.set('activeConnector', undefined);

        currentCollection = cid;

        var conn = connectors[cid];

        // custom data connector

        templates.placeTemplate = Handlebars.compile(defaultPlaceTemplate);
        templates.placeTemplateList = Handlebars.compile(defaultPlaceTemplateList);

        conn.init();
        conn.getAll();

        return;
    }

    if(!cid) {
        if(currentCollection) {
            Map.newShapes();
            Session.set('activeConnector', undefined);
            Map.removeDrawControl();
            currentCollection = undefined;
        }

        if(!Map.activeBaseMap) {
            Map.switchBaseLayer(Map.defaultBaseMap);
        }

        return;
    }

    var c = MCollections.findOne(cid);

    if(!c) {
        return;
    }

    if(cid != currentCollection) {
        
        console.log('Reset collection');

        Session.set('activeConnector', undefined);
        Session.set('activeTheme', undefined);
        Session.set('autoLoading', true);
        Session.set('activeLimit', DEFAULT_PLACE_LIMIT);
        Session.set('activeFilter', undefined);
        Session.set('activeFilterName', undefined);
        Session.set('placeList', false);

        currentCollection = cid;

        DefaultMapDriver.init(cid, c);

        Map.newShapes();

        if(c.transitName) {
            TransitConnector.init(c.transitName);
        }

        templates.placeTemplate = Handlebars.compile(
            c.placeTemplate || c.place_template || defaultPlaceTemplate);

        templates.placeTemplateList = Handlebars.compile(
            c.placeTemplateList || c.place_template_list || defaultPlaceTemplateList);

        templates.placeTemplateLabel = Handlebars.compile(
            c.placeTemplateLabel || c.place_template_label || defaultPlaceTemplateLabel);

    }

    // this needs to be outside of the if statement above so it
    // will run every time a person logs in or out
    if(writePermission(undefined, cid, Meteor.user(), 'place')) {
        Map.addDrawControl();
    } else {
        Map.removeDrawControl();
    }

    Map.mapDriver.subscribe();
};
