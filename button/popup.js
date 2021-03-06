$(function() {
    localizePage();

    var BG = chrome.extension.getBackgroundPage();

    // Set menu entries appropriately for the selected tab.
    $(".menu-entry, .menu-status, .separator").hide();

    BG.getCurrentTabInfo(function(info) {
        var shown = {};
        function show(L) { L.forEach(function(x) { shown[x] = true;  }); }
        function hide(L) { L.forEach(function(x) { shown[x] = false; }); }

        show(["div_options", "separator2"]);
        var paused = BG.adblock_is_paused();
        if (paused) {
            show(["div_status_paused", "separator0","div_paused_adblock", "div_options"]);
        } else if (info.disabled_site) {
            show(["div_status_disabled", "separator0", "div_pause_adblock",
                  "div_options", "div_help_hide_start"]);
        } else if (info.whitelisted) {
            show(["div_status_whitelisted","div_enable_adblock_on_this_page", "div_show_resourcelist",
                  "separator0", "div_pause_adblock", "separator1",
                  "div_options", "div_help_hide_start"]);
        } else {
            show(["div_pause_adblock", "div_blacklist", "div_whitelist",
                  "div_whitelist_page", "div_show_resourcelist",
                  "div_report_an_ad", "separator1", "div_options",
                  "div_help_hide_start", "separator3", "block_counts"]);

            var page_count = info.tab_blocked || "0";
            $("#page_blocked_count").text(page_count);
            $("#total_blocked_count").text(info.total_blocked);

            // Show help link until it is clicked.
            $("#block_counts_help").
            toggle(BG.get_settings().show_block_counts_help_link).
            click(function() {
                BG.set_setting("show_block_counts_help_link", false);
                BG.openTab($(this).attr("href"));
                $(this).hide();
                closeAndReloadPopup();
            });
        }

        var host = parseUri(info.tab.url).host;
        var advanced_option = BG.get_settings().show_advanced_options;
        var eligible_for_undo = !paused && (info.disabled_site || !info.whitelisted);
        var url_to_check_for_undo = info.disabled_site ? undefined : host;
        if (eligible_for_undo &&
            BG.count_cache.getCustomFilterCount(url_to_check_for_undo) &&
            !LEGACY_SAFARI_51)
            show(["div_undo", "separator0"]);

        if (!advanced_option)
            hide(["div_show_resourcelist"]);

        if (SAFARI && !advanced_option)
            hide(["div_report_an_ad", "separator1"]);

        var url = info.tab.url;
        if (host === "www.youtube.com" &&
            /channel|user/.test(url) &&
            /ab_channel/.test(url) &&
            eligible_for_undo &&
            BG.get_settings().youtube_channel_whitelist) {
            $("#div_whitelist_channel").html(translate("whitelist_youtube_channel",
                                                       parseUri.parseSearch(url).ab_channel));
            show(["div_whitelist_channel"]);
        }

        if (chrome.runtime && chrome.runtime.id === "pljaalgmajnlogcgiohkhdmgpomjcihk")
            show(["div_status_beta"]);

        for (var div in shown)
            if (shown[div])
                $('#' + div).show();

        if (SAFARI ||
            !info.display_menu_stats ||
            paused ||
            info.disabled_site ||
            info.whitelisted) {
            $("#block_counts").hide();
        }

        // Secure Search UI
        var shouldShow = false;
        if (!BG.SAFARI) shouldShow = localStorage.search_show_form;
        if (shouldShow=="true") {
            $('#search_control').show();
            $('#search_page').show();
            $('#search-separator2').show();
            if (info.disabled_site && !paused) $('#search-separator1').show();
        } else {
            $('#search_control').hide();
            $('#search_page').hide();
            $('#search-separator2').hide();
            if (!info.disabled_site || paused) $('#search-separator1').hide();
        }
        // End - Secure Search UI
    });

    if (SAFARI) {
        // Update the width and height of popover in Safari
        $(window).load(function() {
            var popupheight = $("body").outerHeight();
            safari.extension.popovers[0].height = popupheight + 5;
            safari.extension.popovers[0].width = 270;
        });

        // Store tab id of an active tab
        var activeTab = safari.application.activeBrowserWindow.activeTab;
    }

    // We need to reload popover in Safari, so that we could
    // update popover according to the status of AdBlock.
    // We don't need to reload popup in Chrome,
    // because Chrome reloads every time the popup for us.
    function closeAndReloadPopup() {
        if (SAFARI) {
            safari.self.hide();
            setTimeout(function() {
                window.location.reload();
            }, 200);
        } else {
            window.close();
        }
    }

    // Click handlers
    $("#bugreport").click(function() {
        var out = BG.makeReport();
        var result = "http://support.getadblock.com/discussion/new" +
            "?category_id=problems&discussion[body]=" + out;
        BG.openTab(result);
        closeAndReloadPopup();
    });

    $("#titletext").click(function() {
        var chrome_url = "https://chrome.google.com/webstore/detail/gighmmpiobklfepjocnamgkkbiglidom";
        var opera_url = "https://addons.opera.com/extensions/details/adblockforopera/";
        var getadblock_url = "https://getadblock.com/"
        if (OPERA) {
            BG.openTab(opera_url);
        } else if (SAFARI) {
            BG.openTab(getadblock_url);
        } else {
            BG.openTab(chrome_url);
        }
        closeAndReloadPopup();
    });

    $("#div_enable_adblock_on_this_page").click(function() {
        BG.getCurrentTabInfo(function(info) {
            if (BG.try_to_unwhitelist(info.tab.url)) {
                !SAFARI ? chrome.tabs.reload() : activeTab.url = activeTab.url;
                closeAndReloadPopup();
            } else {
                $("#div_status_whitelisted").
                replaceWith(translate("disabled_by_filter_lists"));
            }
        });
    });

    $("#div_paused_adblock").click(function() {
        BG.adblock_is_paused(false);
        BG.handlerBehaviorChanged();
        if (!SAFARI)
            BG.updateButtonUIAndContextMenus();
        closeAndReloadPopup();
    });

    $("#div_undo").click(function() {
        BG.getCurrentTabInfo(function(info) {
            var host = parseUri(info.tab.url).host;
            BG.confirm_removal_of_custom_filters_on_host(host);
            closeAndReloadPopup();
            if (SAFARI)
                activeTab.url = activeTab.url;
        });
    });

    $("#div_whitelist_channel").click(function() {
        BG.getCurrentTabInfo(function(info) {
            BG.create_whitelist_filter_for_youtube_channel(info.tab.url);
            closeAndReloadPopup();
            !SAFARI ? chrome.tabs.reload() : activeTab.url = activeTab.url;
        });
    });

    $("#div_pause_adblock").click(function() {
        BG.adblock_is_paused(true);
        if (!SAFARI)
            BG.updateButtonUIAndContextMenus();
        closeAndReloadPopup();
    });

    $("#div_blacklist").click(function() {
        BG.getCurrentTabInfo(function(info) {
            if (!SAFARI) {
                BG.emit_page_broadcast(
                    {fn:'top_open_blacklist_ui', options: { nothing_clicked: true }},
                    { tab: info.tab } // fake sender to determine target page
                );
            } else {
                BG.dispatchMessage("show-blacklist-wizard");
            }
            closeAndReloadPopup();
        });
    });

    $("#div_whitelist").click(function() {
        BG.getCurrentTabInfo(function(info) {
            if (!SAFARI) {
                BG.emit_page_broadcast(
                    {fn:'top_open_whitelist_ui', options:{}},
                    { tab: info.tab } // fake sender to determine target page
                );
            } else {
                BG.dispatchMessage("show-whitelist-wizard");
            }
            closeAndReloadPopup();
        });
    });

    $("#div_whitelist_page").click(function() {
        BG.getCurrentTabInfo(function(info) {
            BG.create_page_whitelist_filter(info.tab.url);
            closeAndReloadPopup();
            !SAFARI ? chrome.tabs.reload() : activeTab.url = activeTab.url;
        });
    });

    $("#div_show_resourcelist").click(function() {
        BG.getCurrentTabInfo(function(info) {
            BG.launch_resourceblocker("?tabId=" + info.tab.id);
            closeAndReloadPopup();
        });
    });

    $("#div_report_an_ad").click(function() {
        BG.getCurrentTabInfo(function(info) {
            var url = "pages/adreport.html?url=" + escape(info.tab.url) + "&tabId=" + info.tab.id;
            BG.openTab(url, true);
            closeAndReloadPopup();
        });
    });

    $("#div_options").click(function() {
        BG.openTab("options/index.html");
        closeAndReloadPopup();
    });

    $("#div_help_hide").click(function() {
        if (OPERA) {
            $("#help_hide_explanation").text(translate("operabutton_how_to_hide2")).slideToggle();
        } else if (SAFARI) {
            $("#help_hide_explanation").text(translate("safaributton_how_to_hide2")).
            slideToggle(function() {
                var popupheight = $("body").outerHeight();
                safari.extension.popovers[0].height = popupheight;
            });
        } else {
            $("#help_hide_explanation").slideToggle();
        }
    });

    $("#link_open").click(function() {
        var linkHref = "https://getadblock.com/share/";
        BG.openTab(linkHref);
        closeAndReloadPopup();
        return;
    });
});