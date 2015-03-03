var TOPICS =
    [ 'crowdfunding', 'closelyheld', 'closelyheld-ref1', 'etax'
    , 'distant-education', 'telework', 'telemedicine'
    , 'data-levy', 'consumer-protection', 'personal-data-protection'
    ];
var PREFIXES =
    [ { key: "commerce"
      , title: "可以不去開曼設公司嗎？"
      , description: "台灣許多新創公司都會跑去開曼群島之類的地方設立，為什麼不願意留在台灣呢？"
      , issue: "群眾募資、閉鎖型公司、網路交易課稅"
      }
    , { key: "lifestyle"
      , title: "踏進充滿想像的任意門。"
      , description: "在數位化生活的時代，要怎樣利用網路無遠弗屆的特性，創造更多的想像空間？"
      , issue: "遠距教育、勞動、健康照護"
      }
    , { key: "civic"
      , title: "黑盒子打開之後..."
      , description: "透過網路發展的公民社會，應該如何同時營造自由且安全的數位環境？"
      , issue: "開放資料、消費者保護、個人資料去識別化"
      }
    ];
var app = angular.module("app", [
  "angular-carousel",
  "ngRoute",
  "meta",
  "angulartics",
  "angulartics.google.analytics"
]);

app.config(['$routeProvider','$locationProvider','$sceDelegateProvider','MetaProvider',
  function($routeProvider,$locationProvider,$sceDelegateProvider,MetaProvider){
    $sceDelegateProvider.resourceUrlWhitelist([
      'self',
      'https://vtaiwan.tw/**',
      'https://*.vtaiwan.tw/**'
    ]);

    TOPICS.forEach(function(x) {
        $routeProvider.
          when('/'+x,{
          templateUrl: 'partials/proposal.html',
          controller: 'ProposalCtrl'
        }).
          when('/'+x+'/:id',{
          templateUrl: 'partials/proposal.html',
          controller: 'ProposalCtrl'
        }).
          when('/'+x+'/:id/:topic_id',{
          templateUrl: 'partials/proposal.html',
          controller: 'ProposalCtrl'
        });
    });
    PREFIXES.forEach(function(x) {
      $routeProvider.
        when('/' + x.key,{
        templateUrl: 'partials/proposals.html',
        controller: 'IndexCtrl'
      });
    });

    $routeProvider.
      when('/proposals',{
      templateUrl: 'partials/proposals.html',
      controller: 'IndexCtrl'
    }).
      when('/about',{
      templateUrl: 'partials/about.html',
      controller: 'IndexCtrl'
    }).
      when('/how',{
      templateUrl: 'partials/how.html',
      controller: 'IndexCtrl'
    }).
      when('/contact',{
      templateUrl: 'partials/contact.html',
      controller: 'IndexCtrl'
    }).
      when('/tutorial',{
      templateUrl: 'partials/tutorial.html',
      controller: 'IndexCtrl'

    }).
      otherwise({
      redirectTo:'/',
      templateUrl: 'partials/index.html',
      controller: 'IndexCtrl'
    });

    MetaProvider.
      otherwise({
        title: 'vTaiwan 線上法規討論平台',
        description: '這是行政院虛擬世界發展法規調適規劃方案的線上法規討論平台，由資策會科技法律研究所與 g0v vTaiwan.tw 專案參與者共同建置。'
    });

    //$locationProvider.html5Mode(true);

  }]);

app.run(function (Meta) {
  Meta.init();
});

app.factory('DataService', function ($http, $q){

  var DataService = {};
  var CachedData;  // get json data, properly merged, and save locally.
  var CachedFetched = false;

  function removeLexicon (text) {
    var hint = /<span\ class=\"hint\"\ data-hint=\"(?:.+\n?)+\">(.+)<\/span>/;
    return text.replace(hint, function (matched, raw) {
      return raw;
    });
  }

  function replaceLink (post) {
    return post.replace(/href=\"\/(users\/[^\"]+)\"/g, function (matched, it) {
      return "target=\"_blank\" href=\"https://talk.vtaiwan.tw/" + it + "\"";
    }).replace(/src=\"\/(images\/[^\"]+)\"/g, function (matched, it) {
      return "src=\"https://talk.vtaiwan.tw/" + it + "\"";
    });
  }

  DataService.getCatchedData = function(){
    var deferred = $q.defer();

    if(CachedFetched === true){
        console.log("sending cached:");
        console.log(CachedData);
        deferred.resolve(CachedData);

    }else{

      DataService.getData().then(function (data) {

        deferred.resolve(data);
        CachedFetched = true;
      });

    }
    return deferred.promise;
  };

  DataService.getData = function(){
    CachedData = {};
    var deferred = $q.defer();

    //[1] Get gitbook content
    DataService.getProposalMetaData().then(function(proposals) {
    proposals.map(function (proposal_item) {
        DataService.getBookData(proposal_item.title_eng).then(function (book_data){
            CachedData[proposal_item.title_eng] = {};
            CachedData[proposal_item.title_eng].categories = book_data;
            CachedData[proposal_item.title_eng].title_cht = proposal_item.title_cht;
            CachedData[proposal_item.title_eng].title_eng = proposal_item.title_eng;

            //Add id & preid & next id
            var index = 1;
            CachedData[proposal_item.title_eng].categories.map(function (category_item) {
              category_item.id = index;
              if(index > 1)
                  category_item.preid = index - 1;

              if(index < CachedData[proposal_item.title_eng].categories.length)
                  category_item.nextid = index + 1;

              index++;

              // remove lexicon
              if(category_item.children) {
                category_item.title = removeLexicon(category_item.title);
                category_item.children = category_item.children.map(function (child) {
                  child.title = removeLexicon(child.title);
                  return child;
                });
              }

            });



            //[2] Add topic id step1: get a list of all topics and ids
            DataService.getPostIdData(proposal_item.category_num).then(function (id_data){
                var topics_array = id_data.topic_list.topics;
                var topics_to_id_table = {};//e.g. topics_to_id_table['群眾募資'] = 14;

                topics_array.map(function (topics_item){
                    topics_to_id_table[topics_item.fancy_title] = topics_item.id;
                });

                //Add topic id step2: using fancy_title comparason to add id
                CachedData[proposal_item.title_eng].categories.map(function (category_item){

                    //category_item.children are the discuss topics
                    if(category_item.children){

                        //Count Topics
                        if(!CachedData[proposal_item.title_eng].TopicCount)
                          CachedData[proposal_item.title_eng].TopicCount = 0;
                        CachedData[proposal_item.title_eng].TopicCount += category_item.children.length;

                        var cindex = 1;
                        category_item.children.map(function (children_item) {
                            children_item.id = topics_to_id_table[children_item.title];
                            children_item.index = cindex;

                            //[3] Get discuss data from discourse

                            if(!children_item.requested){//////////////////////////// TODO: workaround, angular run twice.
                            children_item.requested = true;//////////////////////////// TODO: workaround, angular run twice.

                            DataService.getPostData(children_item.id).then(function (posts_data) {

                                children_item.posts = posts_data.post_stream.posts;
                                children_item.post_count = posts_data.posts_count;

                                //Count Posts
                                if(!CachedData[proposal_item.title_eng].PostCount)
                                    CachedData[proposal_item.title_eng].PostCount = 0;
                                    CachedData[proposal_item.title_eng].PostCount += posts_data.posts_count;

                                // Parse direct image url
                                // from: "/user_avatar/talk.vtaiwan.tw/audreyt/{size}/6.png"
                                // to: "/user_avatar/talk.vtaiwan.tw/audreyt/50/6.png"
                                for(var key in children_item.posts){
                                    children_item.posts[key].avatar_url = 'https://talk.vtaiwan.tw/' + children_item.posts[key].avatar_template.replace('{size}', '90');
                                }

                                // Fixed issue #29
                                children_item.posts.map(function (post) {
                                  post.cooked = replaceLink(post.cooked);
                                });
                                //console.log(CachedData);//debug check

                                //Detect if all data is collected
                                // (1) last proposal
                                if(proposal_item.title_eng === proposals[proposals.length-1].title_eng){
                                    // (2) last proposal's last category
                                    var categories = CachedData[proposal_item.title_eng].categories;
                                    if(category_item.title === categories[categories.length-1].title){

                                        // (3) last proposal's last category's last children(topic)
                                        var topics = category_item.children;
                                        if(children_item.title === topics[topics.length-1].title){
                                            //console.log("back!(1)");
                                            deferred.resolve(CachedData);
                                        }
                                    }
                                }

                            });
                            }//////////////////////////// TODO: workaround, angular run twice.
                            cindex++;


                        });
                    }else{
                        //Detect if all data is collected
                        // (1) last proposal
                        if(proposal_item.title_eng === proposals[proposals.length-1].title_eng){
                            // (2) last proposal's last category
                            var categories = CachedData[proposal_item.title_eng].categories;
                            if(category_item.title === categories[categories.length-1].title){
                                console.log("back!(2)");
                                deferred.resolve(CachedData);

                            }
                        }


                    }

                });

            });

        });

    }); });


    return deferred.promise;
  };

  DataService.getBookData = function(path){
    var deferred = $q.defer();
    var b64 = localStorage.getItem(path);
    if (b64) {
        deferred.resolve(JSON.parse(window.atob(b64)));
        return deferred.promise;
    }
    $http.get('https://api.github.com/repos/g0v/'+ path + '-gitbook/contents/content.json?ref=gh-pages').
        success(function(data, status, headers, config) {
            localStorage.setItem(path, data.content);
            deferred.resolve(JSON.parse(window.atob(data.content)));
        }).
        error(function(data, status, headers, config) {
          deferred.resolve(data);
        });
    return deferred.promise;
  };

  DataService.getPostIdData = function(category_num){
    var deferred = $q.defer();
    $http.get('https://talk.vtaiwan.tw/c/'+category_num+'-category.json').
    success(function(data, status, headers, config) {
          deferred.resolve(data);
        }).
        error(function(data, status, headers, config) {
          deferred.resolve(data);
        });
    return deferred.promise;
  };

  DataService.getPostData = function(topicID){
    var deferred = $q.defer();
    $http.get('https://talk.vtaiwan.tw/t/topic/'+topicID+'.json').
      success(function(data, status, headers, config) {
        if (data.posts_count <= 20) {
          return deferred.resolve(data);
        }
        for (var i = 2; i <= parseInt(data.posts_count/20)+1; i++) {
          $http.get('https://talk.vtaiwan.tw/t/topic/'+topicID+'.json?page=' + i).
            success(function (pageData) {
              data.post_stream.posts = data.post_stream.posts.concat(pageData.post_stream.posts);
              if (data.post_stream.posts.length === data.posts_count) {
                data.post_stream.posts.sort(function (a, b) {
                  return +a.id - +b.id;
                });
                deferred.resolve(data);
              }
            }).
            error(function(data) {
              deferred.resolve(data);
            });
        }
      }).
      error(function(data, status, headers, config) {
        deferred.resolve(data);
      });
    return deferred.promise;
  };

  DataService.getProposalMetaData = function(topicID){
    var deferred = $q.defer();
    $http.get('proposals.json').
    success(function(data, status, headers, config) {
          deferred.resolve(data);
        }).
        error(function(data, status, headers, config) {
          deferred.resolve(data);
        });
    return deferred.promise;
  };

  return DataService;
})

app.controller('NavCtrl', ['$scope', 'DataService', '$location', function ($scope, DataService, $location){
  $scope.TOPICS = TOPICS;
  $scope.safeApply = function(fn){
    var phase;
    phase = $scope.$$phase;
    if (phase === '$apply' || phase === '$digest') {
      return fn();
    } else {
      return $scope.$apply(fn);
    }
  };
  DataService.getProposalMetaData().then(function (data) {
    $scope.meta = {}
    $scope.safeApply(function(){
      data.forEach(function(item) {
        $scope.meta[item.title_eng] = item;
      });
    });
  });
  $scope.setProposal = function (value) {
    console.log(value);
    console.log("***");
    $scope.proposal = value;
    DataService.getCatchedData().then(function (data) {
      $scope.currentProposal = data[value];

    });

  };
  $scope.go = function(path){
      $("body").scrollTop(0);
      $location.path(path);
      setTimeout(function(){
          $("body").scrollTop(0);
      }, 100);
  };

  $scope.showsidebar = function(value){
      $("body").scrollTop(0);
      if(value === 'toggle'){
          $scope.sidebar = !$scope.sidebar;
      }else{
          $scope.sidebar = value;
      }

  };

  $scope.isProposalSet = function () {
    return $scope.proposal;
  };

}]);

app.controller('IndexCtrl', ['$scope', 'DataService', '$location', '$sce', function ($scope, DataService, $location, $sce){
  $scope.proposal = {};
  $scope.TOPICS = TOPICS;
  $scope.PREFIXES = PREFIXES;
  $scope.safeApply = function(fn){
    var phase;
    phase = $scope.$$phase;
    if (phase === '$apply' || phase === '$digest') {
      return fn();
    } else {
      return $scope.$apply(fn);
    }
  };
  DataService.getCatchedData().then(function (d) { $scope.safeApply(function(){
    $scope.idx = 1;
    Object.keys(d).map(function (title){
      var blockquote = d[title].categories[0].content.match(/<blockquote>\n((?:.+\n)+)<\/blockquote>\n/);
      $scope.proposal[title] = (blockquote)? blockquote[1] : "";
      // console.log(d[title]);
      // console.log(d[title].TopicCount);
      // console.log(d[title].PostCount);
      // console.log(title);

      if(!$scope.proposalMeta)
          $scope.proposalMeta = {};
      if(!$scope.proposalMeta[title])
          $scope.proposalMeta[title] = {};

      $scope.proposalMeta[title].TopicCount = d[title].TopicCount;
      $scope.proposalMeta[title].PostCount = d[title].PostCount;


    });
  }) });

  DataService.getProposalMetaData().then(function (data) {

      if(!$scope.proposalMeta)
        $scope.proposalMeta = {};

      data.map(function(item){
          $scope.proposalMeta[item.title_eng] = item;

          //Parse date strings to JS date object
          item.step1_start_date = new Date(item.step1_start_date);
          item.step1_end_date = new Date(item.step1_end_date);

          $scope.focusTab[item.title_eng] = 'step' + item.current_step;

          //Count hours passed & days left
          //var now = new Date("February 16, 2015 00:00:00");
          var now = new Date();

          //Count times left from start date (in percentage)
          var total_hours = (item.step1_end_date.getTime() - item.step1_start_date.getTime())/ (3600*1000);
          if(now >= item.step1_start_date){
            var passed =  (now.getTime() - item.step1_start_date.getTime());
            item.passed_hour = passed / (3600*1000);
            var left = (item.step1_end_date.getTime() - now.getTime());
            item.left_day = Math.round(left / (3600*1000) / 24);
            item.percentage = Math.round(item.passed_hour / total_hours * 100);

            console.log(item.percentage);

          }else{
            item.left_day = Math.round(total_hours / 24);
            item.percentage = 0;
          }
      });
  });

  $scope.go = function(path){
      $("body").scrollTop(0);
      $location.path(path);
  };

  $scope.cover = "small";
  if($( window ).width() > 400){
    $scope.cover = "large";
  }

  $( window ).resize(function() {
    //console.log($( window ).width());
    if($( window ).width() > 400){
      $scope.cover = "large";
    }else{
      $scope.cover = "small";
    }
    $scope.$apply();
  });

  $scope.toTrusted = function(html_code) {
    return $sce.trustAsHtml(html_code);
  };

  //default choice
  $scope.focusTab = {};

  $scope.setFocusTab = function (title, value){
    $scope.focusTab[title] = value;
  };
  $scope.isFocusTab = function (title, value){
    return $scope.focusTab[title] === value;
  };
  $scope.getTopics = function () {
    var key = $location.url().replace(/\/+/g, '');
    if (key === 'proposals' || !$scope.proposalMeta) { return TOPICS; }
    return TOPICS.filter(function(t){
        console.log($scope.proposalMeta[t]);
        return($scope.proposalMeta[t].prefix_eng === key);
    });
  };
}]);

app.controller('ProposalCtrl', ['$scope', 'DataService', '$location', '$sce', '$routeParams', '$route', function ($scope, DataService, $location, $sce, $routeParams, $route){

  topicref = $location.$$url.split('/')[1] || 'crowdfunding';
  //topicref = $location.path().split('/')[1] || 'crowdfunding';
  //console.log($location.path().split('/')[1]);

  $scope.topicref = topicref;

  $scope.order = 'signatures_count';
  $scope.recommendFilter = 0;




  $scope.toggleExpand = function () {
    $scope.expand = !$scope.expand;
  };
  $scope.isExpand = function() {
    return $scope.expand;
  };

  $scope.recommendFilterFunction = function (n) {
    //console.log(n.recommend + '---' + $scope.recommendFilter);
    if(n.recommend >= $scope.recommendFilter)
       return n;
  };
  $scope.setRecommendFilter = function (value) {
    $scope.recommendFilter = value;
  };

  $scope.toggleReplyItem = function() {
    $scope.showReplyItem = !$scope.showReplyItem;
  };

  $scope.isCategoryFocused = function (qid) {
    return $scope.focusCategory === qid;
  };

  $scope.toggleCategory = function(qid, topic_id){
    $scope.categoryToggled = true;

    if(qid === false){
      $scope.focusCategory = false;

    }else{

      if(topic_id) {
        $location.path('/' + topicref + '/' + qid + '/' + topic_id);
        DataService.getPostData(topic_id).then(function (d) {
          $scope.currentCategory.children.map(function (child, index) {
            if(child.id === topic_id) {
              $scope.toggleDiscussion(index + 1);
            }
          });
        });
      } else {
        $location.path('/' + topicref + '/' + qid);
      }

      $scope.focusCategory = qid;

      $scope.currentCategory = $scope.categories[qid-1];
      //$("body").scrollTop(0);
    }

  };

  $scope.go = function(path, replace){
      //$("body").scrollTop(0);
      //console.log(path);
      $location.path(path);
      if (replace) $location.replace();
  };

  DataService.getCatchedData().then(function (d) {
      $scope.currentProposal = d[$scope.topicref];
      $scope.categories = d[$scope.topicref].categories;
      if($routeParams.id){
        $scope.toggleCategory(parseInt($routeParams.id), parseInt($routeParams.topic_id));

      }else{
        $scope.go($scope.currentProposal.title_eng + '/1', true);
      }

  });

  /* Prevent page relaod when selecting discussion. (So user won't get lost) */
  var lastRoute = $route.current;
  $scope.$on('$locationChangeSuccess', function(event) {
      if($route.current.pathParams){
          //console.log($route.current.pathParams);
          //if($route.current.pathParams.topic_id)
          if($route.current.pathParams.id === lastRoute.pathParams.id)
            $route.current = lastRoute;

      }
  });

  $scope.toggleDiscussion = function(index){
      console.log(index);

      if($scope.focusDiscussion === index){
        $scope.focusDiscussion = false;

        document.getElementById('focus-discussion').scrollTop = 0;
        $location.path('/' + topicref + '/' + $scope.currentCategory.id);


      }else{
        $location.path('/' + topicref + '/' + $scope.currentCategory.id + '/' + $scope.currentCategory.children[index-1].id);
        $scope.focusDiscussion = index;
        $scope.currentDiscussion = $scope.currentCategory.children[index-1];
        $scope.expand = null;

      }

  };

  $scope.toTrusted = function(html_code) {
    if(!html_code) return;
    html_code = html_code.replace(/(?:\/\/talk.vtaiwan.tw)?(\/user_avatar.+\.png)/g, function (_0, _1) {
      return "https://talk.vtaiwan.tw" + _1;
    });
    return $sce.trustAsHtml(html_code);
  };

  $scope.shareToFacebook = function() {
    var url = "https://www.facebook.com/sharer/sharer.php?u=" + encodeURIComponent('https://vtaiwan.tw/#!' + $location.$$path);
    window.open(url, 'fbshare', 'width=640,height=320');
  };

  $scope.shareToTwitter = function() {
    var url = "https://twitter.com/intent/tweet?text="+ $scope.currentDiscussion.title + "&amp;url=" + encodeURIComponent('https://vtaiwan.tw/#!' + $location.$$path);
    window.open(url, 'twittershare', 'width=640,height=320');
  };

  $scope.setSharePanel = function (value) {
    $scope.sharePanelIndex = value;
    if(value !==  false){
      var current = document.getElementById("input_"+value);
      current.setSelectionRange(0, current.value.length);
    }
  };
  $scope.shouldShowSharePanel = function (value) {
    return $scope.sharePanelIndex === value;
  };

}]);

