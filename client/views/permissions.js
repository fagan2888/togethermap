var zc1, zc2;

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
        var cid = Session.get('activeCollection');

        var txt = getPermissionsLink(type, cid, currentKey, forceNew);
        clipboard.setData( "text/plain", txt);
        growl.success("Link copied to clipboard.");
    };

    var v = document.getElementById("copy-link");
    var v2 = document.getElementById("new-link");
    if(!v)
        return;

    if(zc1) {
        // clean up
        zc1.off("copy");
        zc2.off("copy");
    }

    zc1 = new ZeroClipboard( v )
        .on( "copy", function( event ) {
            makeLink(event, false);
        });

    zc2 = new ZeroClipboard( v2 )
        .on( "copy", function( event ) {
            makeLink(event, true);
        });
};

Template.permissions.rendered = function () {
    setUpClipboard();
    Session.set("permission_type", "owners");
};

Template.permissions.helpers({
    permissionType: function () {
        var p = Session.get("permission_type") || "Owners";
        return {
            owners: "Owners",
            place_writers: "Placemakers",
            post_writers: "Posters",
            readers: "Readers"
        }[p];
    },

    permissionDescription: function() {
        var p = Session.get("permission_type") || "Owners";
        return {
            owners: "Owners can edit collection attributes and set permissions.",
            place_writers: "Place writers can add places to a collection.",
            post_writers: "Post writers cannot add places but can make comments and vote.",
            readers: "Readers can only browse a collection but cannot add or edit any content."
        }[p];
    },

    listExists: function () {
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

    publicOk: function () {
        return Session.get("permission_type") != 'owners';
    },

    loginreq: function () {
        return this.read_loginreq == true;
    },

    loginreqOk: function () {
        return Session.get("permission_type") == 'readers';
    },

    isPublic: function () {
        var p = Session.get("permission_type");
        Session.set("permission_key", this[p+"_key"]);
        var ret = {
            "readers": isReadPublic(this),
            "place_writers": isWritePublic(this, "place"),
            "post_writers": isWritePublic(this, "post")
        }[p];

        // okay this is abhorrent, but I wait 100 milliseconds for the dom
        // to be ready.  I've spent 90 minutes trying to solve this a better
        // way but fingers crossed that this just works
        _.delay(setUpClipboard, 100);

        return ret;
    }
});

Template.permissions.events = {

    'click .collection-go': function (e) {

        e.preventDefault();
        Router.go('collection_edit', {
            _id: Session.get('activeCollection')
        });
    },

    'click #Owners': function (e) {

        e.preventDefault();
        Session.set("permission_type", 'owners');
    },

    'click #Placers': function (e) {

        e.preventDefault();
        Session.set("permission_type", 'place_writers');
    },

    'click #Posters': function (e) {

        e.preventDefault();
        Session.set("permission_type", 'post_writers');
    },

    'click #Readers': function (e) {

        e.preventDefault();
        Session.set("permission_type", 'readers');
    },

    'click .delete-link': function(e) {

        var user = $(e.target).attr('id');

        e.preventDefault();
        MaterializeModal.confirm({
            title: "Confirm Remove Permission",
            message: "Are you sure you want to remove this permission for this user?",
            callback: function(error, result) {
                if(result && result.submit == true) {
                    var attr = {};
                    var key = Session.get("permission_type");
                    attr[key] = user;
                    var cid = Session.get('activeCollection');
                    Meteor.call('updateCollection', cid, {$pull: attr});
                }
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

    'click .make-loginreq': function () {

        Meteor.call('updateCollection', this._id, {$set: {read_loginreq: true}});
    },

    'click .disable-loginreq': function () {

        Meteor.call('updateCollection', this._id, {$set: {read_loginreq: false}});
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