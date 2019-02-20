"use strict";

// NOTE:  Remember to include the style in the head!

// TODO:  can improve mobile experience where breadcrumb moves to nav, see link below:
// https://s.codepen.io/j_holtslander/fullpage/LBPveZ

module.exports = function (items) {
    if (!items)
        return;

    const container = document.querySelector('.container') || document.querySelector('body');
    const span = document.createElement('span');
    span.setAttribute('id', 'desktop-breadcrumbs');
    span.setAttribute('class', 'hide-on-med-and-down');

    items.forEach(item => {
        const anchor = document.createElement('a');
        anchor.setAttribute('href', item.href || '#');
        anchor.setAttribute('class', 'breadcrumb dark');

        if (item.icon) {
            const icon = document.createElement('i');
            icon.setAttribute('class', 'material-icons');
            icon.appendChild(document.createTextNode(item.icon));
            anchor.appendChild(icon);
        }
        else if (item.text) {
            anchor.appendChild(document.createTextNode(item.text));
        }
        else if (item.dataBind) {
            anchor.setAttribute('data-bind', item.dataBind);
        }

        span.appendChild(anchor);
    });

    if (container.firstChild) {
        container.insertBefore(span, container.firstChild);
    }
    else {
        container.appendChild(span);
    }
};
