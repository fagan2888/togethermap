Template.nav.rendered = function () {
    $('.button-collapse').sideNav({
      menuWidth: 300, // Default is 240
      edge: 'left', // Choose the horizontal origin
      closeOnClick: true // Closes side-nav on <a> clicks, useful for Angular/Meteor
    }
  );
    $('.collapsible').collapsible();
};


Template.nav.helpers({
    sidebarOpen: function () {
        return Session.get('sidebarOpen');
    },

    showSidebar: function () {
        return Session.get('sidebarOpen') !== undefined;
    },

    my_collections: function () {
        return MCollections.find(userIdExpression(Meteor.user()), {sort: {name: 1}});
    },

    no_collections: function () {
        return MCollections.find(userIdExpression(Meteor.user())).count() == 0;
    },

    followed: function () {
        return MFollowed.find({}, {sort: {name: 1}});
    },

    none_followed: function () {
        return MFollowed.find().count() == 0;
    },

    active_collection: function () {
        var cid = Session.get('active_collection');
        if(!cid)
            return;
        if(mobileFormFactor)
            return;
        if(Router.current().route.path())
            // in the search route, this is set to the factual collection
            // but we don't want to display the Factual name here
            return;
        var c = MCollections.findOne(cid);
        if(!c)
            return;
        return c.name;
    },

    active_profile: function () {
        var uid = Session.get('active_user');
        var user = Meteor.users.findOne(uid);
        if(!user)
            return '';
        return user.profile.name || user.profile.displayName || 'No Profile';
    }
});


Template.nav.events = {

    'click .map-sidebar-toggle': function (e) {

        e.preventDefault();
        if(!Map.sidebarOpened) {
            // don't do anything unless we've opened the sidebar before
            return;
        }
        Map.sidebar.toggle();
        if(Map.sidebar.isVisible()) {
            history.back();
        }
    },

    'click .landing-go': function (e) {

        e.preventDefault();
        $.fancybox( renderTmp(Template.landing) );
    },

    'click .settings-go': function (e) {

        e.preventDefault();
        $.fancybox( renderTmp(Template.settings) );
    },

    'click .import-go': function (e) {

        e.preventDefault();
        $.fancybox( renderTmp(Template.import) );
    },

    'click .collection-go': function (e) {

        e.preventDefault();
        Router.go('collection', {_id: this._id});
    },

    'click .collections-go': function (e) {

        e.preventDefault();
        Router.go('collections');
    },

    'click .search-go': function (e) {

        e.preventDefault();
        Router.go('search');
    },

    'click .login': function (e) {

        e.preventDefault();
        $.fancybox( renderTmp(Template.login) );
    },

    'click .logout': function (e) {

        e.preventDefault();

        Session.set('showSidebar', false);
        AccountsTemplates.logout();
    },

    'click .active-collection': function (e) {

        e.preventDefault();
        var cid = Session.get('active_collection');
        Router.go('collection', {_id: cid});
    },

    'click .newCollection': function(e) {
        
        var obj = {'name': 'NEW COLLECTION'};
        
        Meteor.call("createCollection", obj, function(err, key) {
            if (err)
                console.log(err);
        
            Router.go('collection_edit', {_id: key});
        });
    }
};


renderTmp = function (template, data) {
    var node = document.createElement("div");
    document.body.appendChild(node);
    UI.renderWithData(template, data, node);
    return node;
};