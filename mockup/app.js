var app = angular.module("app", [
  "ngRoute"
]);

app.config(['$routeProvider','$locationProvider',
  function($routeProvider,$locationProvider){
    $routeProvider.
      when('/crowdfunding',{
      templateUrl: 'partials/proposal.html',
      controller: 'TopicCtrl'
    }).
      when('/closelyheld/:id',{
      templateUrl: 'partials/proposal.html',
      controller: 'TopicCtrl'
    }).
      when('/closelyheld',{
      templateUrl: 'partials/proposal.html',
      controller: 'TopicCtrl'
    }).
      when('/crowdfunding/:id',{
      templateUrl: 'partials/proposal.html',
      controller: 'TopicCtrl'
    }).
      when('/topics',{
      templateUrl: 'partials/topics.html',
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

    //$locationProvider.html5Mode(true);

  }
]);

app.factory('DataService', function ($http, $q){

  var DataService = {}; 
  var CachedData;  // get json data, properly merged, and save locally.

  var proposals = [
      { "title_cht" : "群眾募資", "title_eng" : "crowdfunding", "category_num" : 6},
      { "title_cht" : "閉鎖型公司", "title_eng" : "closelyheld", "category_num" : 5}
  ];

  DataService.getCatchedData = function(){
    var deferred = $q.defer();
    if(CachedData){
        deferred.resolve(CachedData);
    
    }else{
      DataService.getData().then(function (data) {
        deferred.resolve(data);
      })

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

            //Add id & preid & next id
            var index = 1;
            CachedData[proposal_item.title_eng].categories.map(function (category_item) {
              category_item.id = index;

              if(index > 1) 
                  category_item.preid = index - 1;

              if(index < CachedData[proposal_item.title_eng].categories.length) 
                  category_item.nextid = index + 1;

              index++;

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
                            DataService.getPostData(children_item.id).then(function (posts_data) {
                                children_item.posts = posts_data.post_stream.posts;
                                children_item.post_count = posts_data.posts_count;
                                
                                // Parse direct image url
                                // from: "/user_avatar/talk.vtaiwan.tw/audreyt/{size}/6.png"
                                // to: "/user_avatar/talk.vtaiwan.tw/audreyt/50/6.png"
                                for(var key in children_item.posts){
                                    children_item.posts[key].avatar_url = 'https://talk.vtaiwan.tw/user_avatar/talk.vtaiwan.tw/'+children_item.posts[key].username+'/50/'+children_item.posts[key].uploaded_avatar_id+'.png';
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
                                

                            });
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
    $http.get('http://' + path + '.vtaiwan.tw/content.json').
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

app.controller('AuthCtrl',['$scope', 'DataService', '$location', function($scope, DataService, $location){
  
  $scope.login = function(){

    $scope.user = {"name" : "username tool ongcanno tshowall"};
    //$("#notification").removeClass("notification_hide");

    $("#notification").text("成功登入！");
    setTimeout(function(){
      $("#notification").addClass("notification_show");
      setTimeout(function(){
        $("#notification").removeClass("notification_show");

      },2500);

    },100);
    
  };
  $scope.logout = function(){
    $scope.user = null;

    $("#notification").text("成功登出！");
    setTimeout(function(){
      $("#notification").addClass("notification_show");
      setTimeout(function(){
        $("#notification").removeClass("notification_show");

      },2500);
    },100);
  };

  $scope.toggleUserMenu = function(){
    $scope.showUserMenu = !$scope.showUserMenu;
    
  };
  
}]);
app.controller('NavCtrl', ['$scope', 'DataService', '$location', '$sce', function ($scope, DataService, $location, $sce){

  $scope.go = function(path){
      $("body").scrollTop(0);
      $location.path(path);
      setTimeout(function(){
          $("body").scrollTop(0);
      }, 100);
  };

  $scope.showsidebar = function(value){
      if(value === 'toggle'){
          $scope.sidebar = !$scope.sidebar;
      }else{
          $scope.sidebar = value;
      }
      
  };

  $scope.topics= {};
  

  $scope.setTopic = function (value) {
    //console.log(value);
    //console.log("***");
    DataService.getBookData('crowdfunding').then(function(crowdfunding_data){
        DataService.getBookData('closelyheld').then(function(closelyheld_data){
        
            $scope.topics['crowdfunding'] = crowdfunding_data;
            $scope.topics['closelyheld'] = closelyheld_data;
     
            $scope.topic = value;//crowdfunding, closelyheld
            $scope.currentTopic = $scope.topics[value];
            
            var index = 1;
            for(var key in $scope.currentTopic){
              $scope.currentTopic[key].id = index;
              index++;
            };
     
            if(value === 'crowdfunding'){
                $scope.currentTopicTitle = '群眾募資';
            }else{
                $scope.currentTopicTitle = '閉鎖型公司';
            }
           
        });
    });

    
    
  };

  var current_t = $location.path().split('/')[1];
  $scope.setTopic(current_t);

  $scope.isTopicSet = function () {
    return $scope.topic;
  };

  $scope.toggleQuestion = function(qid){
    $scope.questionToggled = true;

    if(qid === false){
      $scope.focusQuestion = false;
      
    }else{
 
      $scope.focusQuestion = qid;
      //console.log($location.path());
      $location.path('/'+$scope.topicref+'/'+qid);
      $scope.currentQ = $scope.questions[qid];
      //$location.hash(qid);
      $("body").scrollTop(0);
        
    }
    
  };

  
  

}]);
app.controller('IndexCtrl', ['$scope', 'DataService', '$location', '$sce', function ($scope, DataService, $location, $sce){
  
  $scope.go = function(path){
      $("body").scrollTop(0);
      $location.path(path);
  };
  $scope.topic = false;
  
  //console.log($( window ).width());
  
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

app.controller('TopicCtrl', ['$scope', 'DataService', '$location', '$sce', '$routeParams', '$route', function ($scope, DataService, $location, $sce, $routeParams, $route){

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

  $scope.isQuestionFocused = function (qid) {
    return $scope.focusQuestion === qid;
  };

  $scope.toggleQuestion = function(qid){
    $scope.questionToggled = true;

    if(qid === false){
      $scope.focusQuestion = false;
      
    }else{
      $scope.focusQuestion = qid;
      //console.log($location.path());
      $location.path('/' + topicref + '/'+qid);
      console.log($scope.questions[qid-1]);
      $scope.currentQ = $scope.questions[qid-1];
      //$location.hash(qid);
      $("body").scrollTop(0);
        
    }
    
  };

  $scope.go = function(path){
      $("body").scrollTop(0);
      $location.path(path);
  };

  DataService.getCatchedData().then(function (d) {
      $scope.currentProposal = d[$scope.topicref];
      $scope.questions = d[$scope.topicref].categories;

      console.log($scope.questions);
      if($routeParams.id){
        $scope.toggleQuestion(parseInt($routeParams.id));
    
      }else{
        $scope.toggleQuestion(1);

      }
      
  })

  $scope.toggleDiscussion = function(index){
    console.log(index);

  
      if($scope.focusDiscussion === index){
        $scope.focusDiscussion = false;
        document.getElementById('focus-discussion').scrollTop = 0;
        $scope.currentTopicPostCount = null;
        
        
      }else{
        $scope.focusDiscussion = index;
        $scope.currentDiscussion = $scope.currentQ.children[index-1];
        
        $scope.expand = null;
           
      }
   
    
  };
 
  $scope.toTrusted = function(html_code) {
    return $sce.trustAsHtml(html_code);
  };
  
 
}]);
app.controller('TopicsCtrl', ['$scope', '$location', '$routeParams', '$route', function ($scope, $location, $routeParams, $route){
  $scope.go = function(path){
      $("body").scrollTop(0);
      $location.path(path);
  };

 
}]);
