# cogs.ctor

  var Base = cogs.ctor(function(){
  });
  
  var Derived = cogs.ctor(function(){
  }, Derived);

# cogs.event

  var event = cogs.event();
  
  handler = function(){
      console.log('event triggered');
  };

  // subscribe to that event
  event.hook(handler);
  
  // unsubscrbe from that event.
  event.unhook(handler);
  
  // subscribe to that event and unsubscribe once handle gets called.
  event.once(function(){
    console.log('run only once');
  });
  
  // trigger event
  event('param1', 'param2' /* ... */);
  
# the events of cogs.event

  var event = cogs.event();
  
  // subscribe to sub event that gets triggered when handler is added into the event
  event.onHook.hook(function(evt, handler){
    console.log(handler, 'is added');
  });
  
  // subscribe to sub event that gets triggered when handler is remove from the event
  event.onUnhook.hook(function(evt, handler){
    console.log(handler, 'is removed');
  });
  
# cogs.prop

  var _value;
  
  // normal getter setter
  var prop = cogs.prop(function onGet(){ return _value; }, function onSet(value){ _value = value * 2;});
  
  // readonly getter
  var readOnly = cogs.prop(function onGet(){ return _value; });
  
  prop(25);
  
  console.log(prop());
  
  readOnly(30);
  
  console.log(readOnly());
  
  
  