var app = angular.module("app", [
  "ngRoute",
  "meta"
]);

app.config(['$routeProvider','$locationProvider','$sceDelegateProvider','MetaProvider',
  function($routeProvider,$locationProvider,$sceDelegateProvider,MetaProvider){
    $sceDelegateProvider.resourceUrlWhitelist([
      'self',
      'https://vtaiwan.tw/**',
      'https://*.vtaiwan.tw/**'
    ]);

    $routeProvider.
      when('/crowdfunding',{
      templateUrl: 'partials/proposal.html',
      controller: 'ProposalCtrl'
    }).
      when('/crowdfunding/:id',{
      templateUrl: 'partials/proposal.html',
      controller: 'ProposalCtrl'
    }).
      when('/crowdfunding/:id/:topic_id',{
      templateUrl: 'partials/proposal.html',
      controller: 'ProposalCtrl'
    }).
      when('/closelyheld',{
      templateUrl: 'partials/proposal.html',
      controller: 'ProposalCtrl'
    }).
      when('/closelyheld/:id',{
      templateUrl: 'partials/proposal.html',
      controller: 'ProposalCtrl'
    }).
      when('/closelyheld/:id/:topic_id',{
      templateUrl: 'partials/proposal.html',
      controller: 'ProposalCtrl'
    }).
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

  var proposals = [
      { "title_cht" : "群眾募資", "title_eng" : "crowdfunding", "category_num" : 6},
      { "title_cht" : "閉鎖型公司", "title_eng" : "closelyheld", "category_num" : 5}
  ];

  function removeLexicon (text) {
    var hint = /<span\ class=\"hint\"\ data-hint=\"(?:.+\n?)+\">(.+)<\/span>/;
    return text.replace(hint, function (matched, raw) {
      return raw;
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

                                // Parse direct image url
                                // from: "/user_avatar/talk.vtaiwan.tw/audreyt/{size}/6.png"
                                // to: "/user_avatar/talk.vtaiwan.tw/audreyt/50/6.png"
                                for(var key in children_item.posts){
                                    children_item.posts[key].avatar_url = 'https://talk.vtaiwan.tw/' + children_item.posts[key].avatar_template.replace('{size}', '90');
                                }

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

                                // remove newlines posts content
                                children_item.posts = children_item.posts.map(function(post) {
                                  post.cooked = post.cooked.replace(/\n/g, '');
                                  return post;
                                });

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

    });


    return deferred.promise;
  };

  DataService.getBookData = function(path){
    var deferred = $q.defer();
    $http.get('https://' + path + '.vtaiwan.tw/content.json').
        success(function(data, status, headers, config) {
          deferred.resolve(data);
        }).
        error(function(data, status, headers, config) {
          deferred.resolve(data);
        });
    return deferred.promise;
  };

  DataService.getPostIdData = function(category_num){
    var deferred = $q.defer();
    $http.get('https://cors.vtaiwan.tw/c/'+category_num+'-category.json').
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
    $http.get('https://cors.vtaiwan.tw/t/topic/'+topicID+'.json').
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

  $scope.setProposal = function (value) {
    console.log(value);
    console.log("***");
    $scope.proposal = value;//crowdfunding, closelyheld
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

  $scope.go = function(path){
      $("body").scrollTop(0);
      $location.path(path);
  };

  $scope.cover = "cover_small";
  if($( window ).width() > 400){
    $scope.cover = "cover_large";
  }

  $( window ).resize(function() {
    //console.log($( window ).width());
    if($( window ).width() > 400){
      $scope.cover = "cover_large";
    }else{
      $scope.cover = "cover_small";
    }
    $scope.$apply();
  });



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

  $scope.go = function(path){
      //$("body").scrollTop(0);
      $location.path(path);
  };

  DataService.getCatchedData().then(function (d) {
      $scope.currentProposal = d[$scope.topicref];
      $scope.categories = d[$scope.topicref].categories;
      if($routeParams.id){
        $scope.toggleCategory(parseInt($routeParams.id), parseInt($routeParams.topic_id));

      }else{
        $scope.toggleCategory(1);

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

        //document.getElementById('focus-discussion').scrollTop = 0;
        $location.path('/' + topicref + '/' + $scope.currentCategory.id);


      }else{
        $location.path('/' + topicref + '/' + $scope.currentCategory.id + '/' + $scope.currentCategory.children[index-1].id);
        $scope.focusDiscussion = index;
        $scope.currentDiscussion = $scope.currentCategory.children[index-1];
        $scope.expand = null;

      }

  };

  $scope.toTrusted = function(html_code) {
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

}]);

