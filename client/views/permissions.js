setUpClipboard = function () {
    ZeroClipboard.config( { swfPath: "/ZeroClipboard.swf" } );

    if(!Meteor.userId()) {
        // not logged in
        return;
    }

    var makeLink = function (event, forceNew) {
        var clipboard = event.clipboardData;
        var type = Session.get("permission_type");
        var currentKey = Session.get("permission_key");
        var cid = Session.get('active_collection');

        var txt = getPermissionsLink(type, cid, currentKey, forceNew);
        clipboard.setData( "text/plain", txt);
        growl.success("Link copied to clipboard.");
    };

    new ZeroClipboard( document.getElementById("copy-link") )
        .on( "copy", function( event ) {
            makeLink(event, false);
        });

    new ZeroClipboard( document.getElementById("new-link") )
        .on( "copy", function( event ) {
            makeLink(event, true);
        });
};

Template.permissions.rendered = function () {
    Session.set("permission_type", "owners");
};


Template.permissions.helpers({
    permission_type: function () {
        var p = Session.get("permission_type") || "Owners";
        return {
            owners: "Owners",
            place_writers: "Placemakers",
            post_writers: "Posters",
            readers: "Readers"
        }[p]
    },

    list_exists: function () {
        var p = Session.get("permission_type");
        return this[p] && this[p].length > 0;
    },

    usersInList: function () {
        var p = Session.get("permission_type");
        return this[p];
    },

    userName: function() {
        var k = this.toString();
        var u = Meteor.users.findOne(k);
        return (u && u.profile) ? u.profile.name || u.profile.displayName : k;
    },

    public_ok: function () {
        return Session.get("permission_type") != 'owners';
    },

    is_public: function () {
        var p = Session.get("permission_type");
        Session.set("permission_key", this[p+"_key"]);
        var ret = {
            "readers": isReadPublic(this),
            "place_writers": isWritePublic(this, "place"),
            "post_writers": isWritePublic(this, "post")
        }[p];

        // when you go back and forth between public and private the dom for the
        // clipboard gets removed and has to be reinitialized
        if(ret == false)
            setUpClipboard();

        return ret;
    }
});

Template.permissions.events = {

    'click .per_mode': function (e) {

        e.preventDefault();
        Session.set("permission_type", e.target.value);
    },

    'click .collection-go': function (e) {

        e.preventDefault();
        Router.go('collection', {
            _id: this._id
        });
    },

    'click .delete-link': function(e) {

        var user = $(e.target).attr('id');

        e.preventDefault();
        bootbox.confirm("Are you sure you want to remove this permission for this user?", function(result) {
            if(result) {
                var attr = {};
                var key = Session.get("permission_type");
                attr[key] = user;
                var cid = Session.get('active_collection');
                Meteor.call('updateCollection', cid, {$pull: attr});
            }
        });
    },

    'click .make-public': function () {

        var p = Session.get("permission_type");
        var attr = {
            "readers": {read_private: false},
            "place_writers": {place_write_private: false},
            "post_writers": {post_write_private: false}
        }[p];

        Meteor.call('updateCollection', this._id, {$set: attr});
    },

    'click .make-private': function () {

        var p = Session.get("permission_type");
        var attr = {
            "readers": {read_private: true},
            "place_writers": {place_write_private: true},
            "post_writers": {post_write_private: true}
        }[p];

        Meteor.call('updateCollection', this._id, {$set: attr});
    }
};