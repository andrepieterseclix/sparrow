"use strict";

module.exports = function (activeItem) {
    const nav = document.createElement('nav');

    const wrapper = document.createElement('div');
    wrapper.setAttribute('class', 'nav-wrapper pink');
    nav.appendChild(wrapper);

    // Brand
    const brandLogo = document.createElement('a');
    brandLogo.setAttribute('href', 'index.html');
    brandLogo.setAttribute('class', 'brand-logo center');
    brandLogo.appendChild(document.createTextNode('Sparrow'));
    wrapper.appendChild(brandLogo);

    const mobileNavMenu = document.createElement('a');
    mobileNavMenu.setAttribute('href', '#');
    mobileNavMenu.setAttribute('class', 'sidenav-trigger');
    mobileNavMenu.setAttribute('data-target', 'mobile-nav');
    const menuIcon = document.createElement('i');
    menuIcon.setAttribute('class', 'material-icons');
    menuIcon.appendChild(document.createTextNode('menu'));
    mobileNavMenu.appendChild(menuIcon);
    wrapper.appendChild(mobileNavMenu);

    const desktopNav = document.createElement('ul');
    desktopNav.setAttribute('class', 'right hide-on-med-and-down');
    wrapper.appendChild(desktopNav);

    const desktopVideos = document.createElement('li');
    desktopVideos.setAttribute('id', 'videos');
    desktopVideos.setAttribute('class', 'waves-effect waves-light');
    const desktopVideosLink = document.createElement('a');
    desktopVideosLink.setAttribute('href', 'videos.html');
    desktopVideosLink.appendChild(document.createTextNode('Videos'));
    desktopVideos.appendChild(desktopVideosLink);
    desktopNav.appendChild(desktopVideos);

    const desktopCategories = document.createElement('li');
    desktopCategories.setAttribute('class', 'waves-effect waves-light');
    desktopCategories.setAttribute('id', 'categories');
    const desktopCategoriesLink = document.createElement('a');
    desktopCategoriesLink.setAttribute('href', 'categories.html');
    desktopCategoriesLink.appendChild(document.createTextNode('Categories'));
    desktopCategories.appendChild(desktopCategoriesLink);
    desktopNav.appendChild(desktopCategories);

    const desktopManage = document.createElement('li');
    desktopManage.setAttribute('class', 'waves-effect waves-light');
    desktopManage.setAttribute('id', 'manage');
    const desktopManageLink = document.createElement('a');
    desktopManageLink.setAttribute('href', 'manage.html');
    desktopManageLink.appendChild(document.createTextNode('Manage'));
    desktopManage.appendChild(desktopManageLink);
    desktopNav.appendChild(desktopManage);

    // Mobile
    const mobileNav = document.createElement('ul');
    mobileNav.setAttribute('class', 'sidenav');
    mobileNav.setAttribute('id', 'mobile-nav');

    const mobileVideos = document.createElement('li');
    mobileVideos.setAttribute('id', 'videosMobile');
    const mobileVideosLink = document.createElement('a');
    mobileVideosLink.setAttribute('href', 'videos.html');
    mobileVideosLink.appendChild(document.createTextNode('Videos'));
    mobileVideos.appendChild(mobileVideosLink);
    mobileNav.appendChild(mobileVideos);

    const mobileCategories = document.createElement('li');
    mobileCategories.setAttribute('id', 'categoriesMobile');
    const mobileCategoriesLink = document.createElement('a');
    mobileCategoriesLink.setAttribute('href', 'categories.html');
    mobileCategoriesLink.appendChild(document.createTextNode('Categories'));
    mobileCategories.appendChild(mobileCategoriesLink);
    mobileNav.appendChild(mobileCategories);

    const mobileManage = document.createElement('li');
    mobileManage.setAttribute('id', 'manageMobile');
    const mobileManageLink = document.createElement('a');
    mobileManageLink.setAttribute('href', 'manage.html');
    mobileManageLink.appendChild(document.createTextNode('Manage'));
    mobileManage.appendChild(mobileManageLink);
    mobileNav.appendChild(mobileManage);

    // Add to body
    const body = document.querySelector('body');
    if (body.firstChild) {
        body.insertBefore(document.createElement('br'), body.firstChild);
        body.insertBefore(mobileNav, body.firstChild);
        body.insertBefore(nav, mobileNav);
    }
    else {
        body.appendChild(nav);
        body.appendChild(mobileNav);
        body.appendChild(document.createElement('br'));
    }

    // Select active
    if (activeItem) {
        document.querySelector(`#${activeItem}`).classList.add('active');
        document.querySelector(`#${activeItem}Mobile`).classList.add('active');
    }

    // initialise mobile
    document.addEventListener('DOMContentLoaded', () => {
        const elems = document.querySelectorAll('.sidenav');
        const instances = M.Sidenav.init(elems, {});
    });
};
