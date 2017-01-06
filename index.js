"use strict";

const ts = require('./tinyspeck.js');
const request = require('request');
const moment = require('moment');

var slack = ts.instance({ });

var cycleIndex = 0;
var cycle = function(list){
  if (cycleIndex < list.length) cycleIndex++;
  else cycleIndex = 1
  return list[cycleIndex -1];
};
var webuildColors = ['#c11a18', '#e06149', '#228dB7', '#f1e9b4'];
var apiEndpoint = 'http://webuild.sg/api/v1/';

slack.on('/webuild', payload => {
  console.log("Received /webuild slash command from user " + payload.user_id);
  const {
    user_id,
    response_url,
    text
  } = payload;
  
  var isToday = /today/i.test(text);
  var url = apiEndpoint + (isToday ? ('check/' + moment().utcOffset(480).format('YYYY-MM-DD')) : 'events');
  var isPublic = /public/i.test(text);
  
  request.get({
    url: url,
    json: true
  }, function(e, r, body){
    var _events = body.events;
    if (!isToday) _events = _events.slice(0, 5);
    var events = _events.map(function(event){
      var datetime = event.formatted_time.split(',');
      var time = datetime.pop().trim();
      var date = datetime.join(',');
      return {
        title: event.name,
        title_link: event.url,
        color: cycle(webuildColors),
        mrkdwn_in: ['text'],
        text: 'by *' + event.group_name + '* on *' + date + '*, ' + time + '\n' + event.location
      };
    });
    
    var text = 'Oops, there are no events from We Build SG :sweat_smile:';
    if (events.length){
      if (isToday){
        text = 'Events today from We Build SG https://webuild.sg/';
      } else {
        text = 'Upcoming events from We Build SG https://webuild.sg';
      }
    }
    
    slack.send(response_url, {
      response_type: isPublic ? 'in_channel' : 'ephemeral', // Response visible to everyone on the channel
      text: text,  // send a text response (replies to channel if not blank)
      attachments: events, // add attatchments: https://api.slack.com/docs/attachments
    }).then(res => { // on success
      console.log("Response sent to /webuild slash command");
    }, reason => { // on failure
      console.log("An error occurred when responding to /webuild slash command: " + reason);
    });
  });
});

// incoming http requests
slack.listen('3000');