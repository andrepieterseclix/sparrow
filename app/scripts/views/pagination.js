"use strict";

module.exports = function (pageResult, baseUrl, urlParams) {
    urlParams = urlParams || new URLSearchParams(window.location.search);
    const { pageNumber, pageSize, totalRecords } = pageResult;
    const ul = document.createElement('ul');
    const div = document.querySelector('#pagination');
    urlParams.set('s', pageSize);
    let page = 1;

    if (!div) {
        throw new Error('Could not find target element "#pagination".');
    }

    // Left arrow
    ul.appendChild(createArrow('chevron_left', baseUrl, urlParams, pageNumber === 1, pageNumber - 1));

    // Pages
    for (let i = totalRecords; i > 0; i -= pageSize, page++) {
        const pageItem = document.createElement('li');
        const pageAnchor = document.createElement('a');

        urlParams.set('p', page);
        pageAnchor.setAttribute('href', `${baseUrl}?${urlParams.toString()}`);

        pageAnchor.appendChild(document.createTextNode(page));
        pageItem.appendChild(pageAnchor);

        if (page === pageNumber) {
            pageItem.classList.add('active');
        }

        ul.appendChild(pageItem);
    }

    // Right arrow
    ul.appendChild(createArrow('chevron_right', baseUrl, urlParams, pageNumber === page - 1, pageNumber + 1));

    // Add element
    ul.classList.add('pagination', 'center');
    div.appendChild(ul);
};

function createArrow(icon, baseUrl, urlParams, disabled, pageNumber) {
    const arrow = document.createElement('li');
    const arrowAnchor = document.createElement('a');
    const arrowIcon = document.createElement('i');
    arrowIcon.classList.add('material-icons');
    arrowIcon.appendChild(document.createTextNode(icon));
    arrowAnchor.appendChild(arrowIcon);
    arrow.appendChild(arrowAnchor);

    if (disabled) {
        arrow.classList.add('disabled')
    }
    else {
        urlParams.set('p', pageNumber);
        arrowAnchor.setAttribute('href', `${baseUrl}?${urlParams.toString()}`);
    }

    return arrow;
}