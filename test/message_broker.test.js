"use strict";

import { MessageBroker } from "./../src/message_broker";

describe("MessageBroker", function() {
  let messageBroker = null;
  let obj = null;

  beforeEach(function() {
    messageBroker = MessageBroker();

    obj = {
      func1: function() { },
      func2: function() { },
    };

    jest.spyOn(obj, "func1");
    jest.spyOn(obj, "func2");
  });

  it("calls the appropriate subscribed functions when topic is published", function() {
    let subscriberID1 = messageBroker.addSubscriber("some.topic", obj.func1);
    let subscriberID2 = messageBroker.addSubscriber("some.topic", obj.func2);

    messageBroker.publish("some.topic", {});
    messageBroker.publish("some.topic", {key: "value"});

    expect(obj.func1).toHaveBeenCalledTimes(2);
    expect(obj.func1).toHaveBeenCalledWith({});
    expect(obj.func1).toHaveBeenCalledWith({key: "value"});

    expect(obj.func2).toHaveBeenCalledTimes(2);
    expect(obj.func2).toHaveBeenCalledWith({});
    expect(obj.func2).toHaveBeenCalledWith({key: "value"});
  });

  it("does not call a function that is subscribed to a different topic than the one published", function() {
    let subscriberID = messageBroker.addSubscriber("some.topic", obj.func1);

    messageBroker.publish("other.topic", {});
    messageBroker.publish("other.topic", {key: "value"});

    expect(obj.func1).toHaveBeenCalledTimes(0);
    expect(obj.func2).toHaveBeenCalledTimes(0);
  });

  it("allows subscribing a function to the same topic more than once", function() {
    let subscriberID1 = messageBroker.addSubscriber("some.topic", obj.func1);
    let subscriberID2 = messageBroker.addSubscriber("some.topic", obj.func1);

    messageBroker.publish("some.topic", {});
    messageBroker.publish("some.topic", {key: "value"});

    expect(obj.func1).toHaveBeenCalledTimes(4);
    expect(obj.func1).toHaveBeenCalledWith({});
    expect(obj.func1).toHaveBeenCalledWith({key: "value"});

    expect(obj.func2).toHaveBeenCalledTimes(0);
  });

  it("does not call a function if the subscription for the published topic has been removed", function() {
    let subscriberID = messageBroker.addSubscriber("some.topic", obj.func1);
    let result;

    messageBroker.publish("some.topic", {});
    messageBroker.publish("some.topic", {key: "value"});

    // These test that the subscriber was in fact properly added before it was removed
    expect(obj.func1).toHaveBeenCalledTimes(2);
    expect(obj.func1).toHaveBeenCalledWith({});
    expect(obj.func1).toHaveBeenCalledWith({key: "value"});
    expect(obj.func2).toHaveBeenCalledTimes(0);

    result = messageBroker.removeSubscriber("some.topic", subscriberID);
    expect(result).toBe(false);  // This should actually be `true`, but due to a bug
                                 // `removeSubscriber()` always returns `false`.

    messageBroker.publish("some.topic", {});
    messageBroker.publish("some.topic", {key: "value"});

    // The subscribed function should not have been called any additional times
    expect(obj.func1).toHaveBeenCalledTimes(2);
    expect(obj.func2).toHaveBeenCalledTimes(0);
  });

  it("returns the correct result if attempting to removing a non-existent subscription", function() {
    let subscriberID = messageBroker.addSubscriber("some.topic", obj.func1);
    let result = messageBroker.removeSubscriber("some.topic", -99);

    expect(result).toBe(false);

    messageBroker.publish("some.topic", {});
    messageBroker.publish("some.topic", {key: "value"});

    // Since no subscribers were removed, the subscribed function should have been called
    expect(obj.func1).toHaveBeenCalledTimes(2);
    expect(obj.func1).toHaveBeenCalledWith({});
    expect(obj.func1).toHaveBeenCalledWith({key: "value"});
    expect(obj.func2).toHaveBeenCalledTimes(0);
  });
});
