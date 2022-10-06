"use strict";

var MessageBroker = function() {
  var uniqueID = -1;
  var subscribers = {};

  var addSubscriber = function(topic, func) {
    if (!subscribers[topic]) {
      subscribers[topic] = [];
    }

    uniqueID += 1;

    subscribers[topic].push({ id: uniqueID, func: func });
    return uniqueID;
  };

  var removeSubscriber = function(topic, id) {
    let subscribersForTopic = subscribers[topic];

    if (subscribersForTopic) {
      for (let i = 0; i < subscribersForTopic.length; i++) {
        if (subscribersForTopic[i].id === id) {
          subscribersForTopic.splice(i, 1);

          return true;
        }
      };
    }

    return false;
  };

  var publish = function(topic, data) {
    if (!subscribers[topic] || subscribers[topic] === []) {
      console.log("Warning: No listeners for topic " + topic);
    }
    else {
      subscribers[topic].forEach(function(entry) {
        entry.func(data);
      });
    }
  };


  return {
    addSubscriber:    addSubscriber,
    removeSubscriber: removeSubscriber,
    publish:          publish,
  };
};

export { MessageBroker };
