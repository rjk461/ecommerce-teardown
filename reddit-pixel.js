// Reddit Pixel - Shared tracking script
// Pixel ID: a2_i0ibecjyvw87
!function(w,d){if(!w.rdt){var p=w.rdt=function(){p.sendEvent?p.sendEvent.apply(p,arguments):p.callQueue.push(arguments)};p.callQueue=[];var t=d.createElement("script");t.src="https://www.redditstatic.com/ads/pixel.js",t.async=!0;var e=d.getElementsByTagName("script")[0];e.parentNode.insertBefore(t,e)}}(window,document);rdt('init','a2_i0ibecjyvw87');rdt('track','PageVisit');

// Helper function to track custom Reddit events
// Usage: trackRedditEvent('EventName')
// Example: trackRedditEvent('FormSubmit')
window.trackRedditEvent = function(eventName) {
    if (typeof rdt !== 'undefined') {
        rdt('track', eventName);
        console.log('Reddit event tracked:', eventName);
    } else {
        console.warn('Reddit pixel not loaded yet, event queued:', eventName);
        // Queue the event if pixel hasn't loaded
        if (!window.redditEventQueue) window.redditEventQueue = [];
        window.redditEventQueue.push(eventName);
    }
};

// Process queued events once pixel is loaded
if (window.redditEventQueue && window.redditEventQueue.length > 0) {
    window.redditEventQueue.forEach(function(eventName) {
        if (typeof rdt !== 'undefined') {
            rdt('track', eventName);
        }
    });
    window.redditEventQueue = [];
}

