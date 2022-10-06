"use strict";

let MessageBroker = function() {
  let uniqueID = -1;
  let subscribers = {};

  let addSubscriber = function(topic, func) {
    if (subscribers[topic] === undefined) {
      subscribers[topic] = [];
    }

    uniqueID += 1;

    subscribers[topic].push({ id: uniqueID, func: func });
    return uniqueID;
  };

  let removeSubscriber = function(topic, id) {
    let subscribersForTopic = subscribers[topic];

    if (subscribersForTopic !== undefined) {
      for (let i = 0; i < subscribersForTopic.length; i++) {
        if (subscribersForTopic[i].id === id) {
          subscribersForTopic.splice(i, 1);

          return true;
        }
      };
    }

    return false;
  };

  let publish = function(topic, data) {
    if (subscribers[topic] === undefined || subscribers[topic] === []) {
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
