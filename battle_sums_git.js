Players = new Meteor.Collection('players');

if (Meteor.isClient) {
  var player = function () {
    return Players.findOne(Session.get('player_id'));
  };

  Template.name.show_name = function () {
    var me = player();
    if (me && me.name){
      return false;
    }
    return true;
  };

  Template.name.greeting = function () {
    return "Welcome to battle sums, enter your name to join the lobby:";
  };

  Template.name.events({
    'click #start_game' : function (e) {
      var name = $('#name input#myname').val().trim()
      Players.update(Session.get('player_id'), {$set: {name: name}});
    }
  });


  Template.users.show_users = function() {
    return true;
  };

  Template.users.players = function() {
    var players = Players.find({_id: {$ne: Session.get('player_id')},
                              name: {$ne: ''}});

    return players;
  }



  Meteor.startup(function () {
    var player_id = Players.insert({name: '', idle: false});
    Session.set('player_id', player_id);

    Meteor.autosubscribe(function () {
      Meteor.subscribe('players');

      if (Session.get('player_id')) {
        var me = player();
        if (me && me.game_id) {
          // Meteor.subscribe('games', me.game_id);
        }
      }
    });

    Meteor.setInterval(function() {
      if (Meteor.status().connected)
        Meteor.call('keepalive', Session.get('player_id'));
    }, 20*1000);

  });
};

if(Meteor.isServer) {
  Meteor.methods({
    keepalive: function (player_id) {
      Players.update({_id: player_id},
                    {$set: {last_keepalive: (new Date()).getTime(),
                            idle: false}});
    }
  });

  Meteor.setInterval(function () {
    var now = (new Date()).getTime();
    var idle_threshold = now - 70*1000; // 70 sec
    var remove_threshold = now - 60*60*1000; // 1hr

    Players.update({$lt: {last_keepalive: idle_threshold}},
                 {$set: {idle: true}});

  // XXX need to deal with people coming back!
  // Players.remove({$lt: {last_keepalive: remove_threshold}});

  }, 30*1000);
}