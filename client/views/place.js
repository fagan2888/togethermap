var jqueryInit = function (id) {
    initFroala();
};

Template.place.rendered = function () {
    jqueryInit();
};

Template.place.helpers({

    writePermission: function () {
        var cid = Session.get('active_collection');
        return writePermission(this, cid, Meteor.user());
    },

    dateField: function () {
        return this.createDate || this.properties.createDate;
    },

    dynamicPlace: function () {
        // compiled when we change the collection for performance
        if(templates.place_template_list) {
            return templates.place_template(this);
        } else {
            return Handlebars.compile(defaultPlaceTemplate)(this);
        }
    },

    creator: function () {
        return this.creator || this.properties.creator;
    },

    postCount: function () {
        var c = this.post_count || 0;
        return c + ' Post' + (c == 1 ? '' : 's');
    },

    newTopic: function () {
        return Session.get('newTopic');
    },

    noPosts: function () {
        // doesn't count if place isn't loaded
        return this.posts.count() == 0 && this.place;
    },

    postPermission: function () {
        var cid = Session.get("active_collection");
        return writePermission(undefined, cid, Meteor.user(), "post");
    },

    myCollections: function () {
        var mine = MCollections.find(userIdExpression(Meteor.user())).fetch();
        var followed = MFollowed.find().fetch();
        var places = this.allPlaceInstances.fetch();
        var docs = _.filter(mine.concat(followed), function (c) {
            var cid = c.cid || c._id; // can be followed or owned

            var c_obj = MCollections.findOne(cid);
            var p = MPermissions.findOne(cid);
            if(!c_obj) // this happens because you might not have read permission anymore
                return false;
            if(c_obj && c_obj.place_write_private == true && p && p.placeWriter == false && p.owner == false)
                return false;

            var i = _.find(places, function (p) {
                return p.collectionId == cid;
            });
            // if i is defined we don't want to show the collection id again
            return i === undefined;
        });
        return _.sortBy(docs, function(doc) {return doc.name;});
    },

    collectionName: function () {
        return MCollections.findOne(this.collectionId).name;
    },

    isThisCollection: function () {
        return this.collectionId == Session.get('active_collection');
    },

    anyPlaceInstances: function () {
        return this.allPlaceInstances.fetch().length > 0;
    }
});

var closed = true;

Template.place.events = {

    'click .copy-to': function () {
        // I really shouldn't have to do this - there's some sort of bad
        // interaction with bootstrap and the leaflet container
        if(closed) {
            $('.dropdown-toggle').dropdown('toggle');
        } else {
            $('.dropdown.open .dropdown-toggle').dropdown('toggle');
        }
        closed = !closed;
    },

    'click .do-copy': function (e) {

        // the collection can come from either the set of followed collections
        // in which case we need the cid attribute, or the set of owner
        // collection in which case we need the id attribute - this expression
        // should cover it
        var cid = $(e.target).attr('cid') || $(e.target).attr('id');
        var id = Session.get('active_place');
        var p = Template.parentData().place;
        p = JSON.parse(JSON.stringify(p));
        p.post_count = 0;
        if(!p.parent_id) {
            // leave it if it's already on there so it points back to the original
            p.parent_id = p._id;
        }
        delete p._id;
        Meteor.call('insertPlace', p, cid, function(err, data) {
            if (err) {
                console.log(err);
                return;
            }

            console.log(data);
            Router.go('place', {
                _id: data,
                _cid: cid
            })
        });

    },

    'click .pan-map': function () {

        Map.goToPlace(this);
    },

    'click .profile-go': function (e) {

        e.preventDefault();
        Router.go('profile', {_id: this.creatorUID});
    },

    'click .read-more': function (e) {

        e.preventDefault();
        Router.go('post', {
            _id: this._id,
            _cid: this.collectionId
        });
    },

    'click .collection-go': function (e) {

        e.preventDefault();
        Router.go('collection', {
            _id: this.collectionId
        });
    },

    'click .place-go': function (e) {

        e.preventDefault();
        Router.go('place', {
            _id: this._id,
            _cid: this.collectionId
        });
    },

    'click .edit-link': function (e) {

        e.preventDefault();
        Router.go('place_edit', {
            _cid: Session.get('active_collection'),
            _id: this._id
        });
    },

    'click .new-topic': function (e) {

        e.preventDefault();
        Session.set('newTopic', true);
        Meteor.defer(function() {
            jqueryInit();
        });

    },

    'click .add-topic': function (e) {

        e.preventDefault();

        var pid = Session.get('active_place');
        var cid = Session.get('active_collection');
        var title = $( "#title" ).val();
        var html = $( "#editable" ).val();

        if(!title || title.trim().length == 0) {
            growl.warning("Need to enter a post title.");
            return;
        }
        
        if(html.length > 2000) {
            growl.error("Topic too long (maybe you pasted an image?");
            return;
        }

        Meteor.call('insertPost', {
            title: title,
            description: html
        }, pid, cid);

        Session.set('newTopic', false);
    },

    'click .cancel': function (e) {

        e.preventDefault();
        Session.set('newTopic', false);

    }
};