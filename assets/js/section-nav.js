/*
 * Single-page anchor navigation for the masthead.
 *
 * The site navigation points at section anchors on the front page instead of
 * separate pages, so this file only does three small things:
 *
 *   1. keeps --masthead-offset in sync with the real height of the fixed
 *      navigation bar (it is taller on narrow screens), which the stylesheet
 *      uses for `scroll-margin-top`;
 *   2. marks the section that is currently in view;
 *   3. closes the collapsed (mobile) menu after a link is used.
 *
 * It is plain JavaScript on purpose: it must not depend on jQuery or on the
 * npm build step that produces assets/js/main.min.js.
 */
(function () {
  'use strict';

  var ACTIVE_CLASS = 'section-active';
  var nav = document.getElementById('site-nav');

  if (!nav) {
    return;
  }

  // The greedy navigation plugin moves list items between .visible-links and
  // .hidden-links, so look at the whole nav rather than the visible list only.
  // The brand link and the theme toggle have no "#" and are skipped here.
  var links = Array.prototype.slice.call(nav.querySelectorAll('a[href*="#"]'));
  var entries = [];
  var masthead = document.querySelector('.masthead');

  links.forEach(function (link) {
    var hash = (link.getAttribute('href') || '').split('#')[1];
    var target = hash ? document.getElementById(hash) : null;
    var item = link.closest('li');
    var known = entries.some(function (entry) {
      return entry.target === target;
    });

    if (target && item && !known) {
      entries.push({ target: target, item: item });
    }
  });

  if (!entries.length) {
    return;
  }

  // Keep the sections in document order, otherwise "the section above the
  // fold" and "the last section" would be picked in navigation order.
  entries.sort(function (a, b) {
    var position = a.target.compareDocumentPosition(b.target);
    if (position & Node.DOCUMENT_POSITION_FOLLOWING) {
      return -1;
    }
    if (position & Node.DOCUMENT_POSITION_PRECEDING) {
      return 1;
    }
    return 0;
  });

  function offset() {
    var value = parseFloat(
      window.getComputedStyle(document.documentElement).getPropertyValue('--masthead-offset')
    );
    return isNaN(value) ? 0 : value;
  }

  function syncOffset() {
    if (!masthead) {
      return;
    }
    var height = masthead.getBoundingClientRect().height;
    if (height > 0) {
      document.documentElement.style.setProperty('--masthead-offset', height + 'px');
    }
  }

  function syncActive() {
    var threshold = offset() + 24;
    var last = entries[entries.length - 1];
    var active = entries[0];

    entries.forEach(function (entry) {
      if (entry.target.getBoundingClientRect().top <= threshold) {
        active = entry;
      }
    });

    // At the bottom of the page the last section may never reach the
    // threshold, so it is selected explicitly while the page is fully scrolled.
    if (window.innerHeight + window.pageYOffset >= document.body.scrollHeight - 2) {
      active = last;
    }

    entries.forEach(function (entry) {
      entry.item.classList.toggle(ACTIVE_CLASS, entry === active);
    });
  }

  function closeCollapsedMenu() {
    var overflow = nav.querySelector('.hidden-links');
    var button = nav.querySelector('button');

    if (overflow) {
      overflow.classList.add('hidden');
    }
    if (button) {
      button.classList.remove('close');
    }
  }

  var pending = false;

  function onScroll() {
    if (pending) {
      return;
    }
    pending = true;
    window.requestAnimationFrame(function () {
      pending = false;
      syncOffset();
      syncActive();
    });
  }

  links.forEach(function (link) {
    link.addEventListener('click', closeCollapsedMenu);
  });

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  window.addEventListener('load', onScroll);

  syncOffset();
  syncActive();
})();
