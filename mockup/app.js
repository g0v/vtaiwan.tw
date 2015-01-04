var app = angular.module("app", [
  "ngRoute"
]);

app.config(['$routeProvider','$locationProvider',
  function($routeProvider,$locationProvider){
    $routeProvider.
      when('/person/:cid',{
      templateUrl: 'partials/person.html',
      controller: 'PersonCtrl'
    }).
      when('/crowdfunding',{
      templateUrl: 'partials/crowdfunding.html',
      controller: 'TopicCtrl'
    }).
      when('/crowdfunding/:id',{
      templateUrl: 'partials/crowdfunding.html',
      controller: 'TopicCtrl'
    }).
      when('/topics',{
      templateUrl: 'partials/topics.html',
      controller: 'TopicsCtrl'
    }).
      when('/about',{
      templateUrl: 'partials/about.html'
    }).
      when('/how',{
      templateUrl: 'partials/how.html'
    }).
      when('/contact',{
      templateUrl: 'partials/contact.html'
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
  DataService.getData = function(path){
    var deferred = $q.defer();
    $http.get('data/'+path+'.json').
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
  };

  $scope.showsidebar = function(value){
      if(value === 'toggle'){
          $scope.sidebar = !$scope.sidebar;
      }else{
          $scope.sidebar = value;
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
  

  $scope.topicref = 'crowdfunding';
  DataService.getData('questions').then(function(data){
    //console.log(data);
      $scope.questionsObj = data[$scope.topicref].questions;
      $scope.currentTopic = data[$scope.topicref];
      $scope.questions = [];

      for(var key in $scope.questionsObj){
        $scope.questions.push($scope.questionsObj[key]);
      }
       
  });
  $scope.toggleQuestion = function(qid){
    $scope.questionToggled = true;

    if(qid === false){
      $scope.focusQuestion = false;
      
    }else{
 
      $scope.focusQuestion = qid;
      //console.log($location.path());
      $location.path('/crowdfunding/'+qid);
      $scope.currentQ = $scope.questionsObj[qid];
      //$location.hash(qid);
      $("body").scrollTop(0);
        
    }
    
  };
  
}]);

app.controller('TopicCtrl', ['$scope', 'DataService', '$location', '$sce', '$routeParams', '$route', function ($scope, DataService, $location, $sce, $routeParams, $route){

  $scope.order = 'signatures_count';
  $scope.topic = true;
  $scope.topicref = 'crowdfunding';

  $scope.isQuestionFocused = function (qid) {
    return $scope.focusQuestion === qid;
  }
  $scope.toggleQuestion = function(qid){
    $scope.questionToggled = true;

    if(qid === false){
      $scope.focusQuestion = false;
      
    }else{
 
      $scope.focusQuestion = qid;
      //console.log($location.path());
      $location.path('/crowdfunding/'+qid);
      $scope.currentQ = $scope.questionsObj[qid];
      //$location.hash(qid);
      $("body").scrollTop(0);
        
    }
    
  };

  $scope.toggleDiscussion = function(qid){
    
    if(qid === false){
      $scope.focusDiscussion = false;
      document.getElementById('focus-discussion').scrollTop = 0;
    }else{
      if($scope.focusDiscussion=== qid){
        $scope.focusDiscussion = false;
        
      }else{
        $scope.focusDiscussion = qid;      
      }
    }
    
  };
  
  $scope.showLoginTip = function () {
    
    $("#notification").text("請先登入");
    setTimeout(function(){
      $("#notification").addClass("notification_show");
      setTimeout(function(){
          $("#notification").removeClass("notification_show");

      },2500);

    },100);

  };

  $scope.go = function(path){
      $("body").scrollTop(0);
      $location.path(path);
  };

  DataService.getData('questions').then(function(data){
    //console.log(data);
    
      $scope.questionsObj = data[$scope.topicref].questions;
      $scope.currentTopic = data[$scope.topicref];
      $scope.questions = [];

      for(var key in $scope.questionsObj){
        $scope.questions.push($scope.questionsObj[key]);
      }
      if($routeParams.id){
        $scope.toggleQuestion($routeParams.id);
      }else{
        $scope.toggleQuestion("1");

      }
      
      
  });
 
  

  $scope.toTrusted = function(html_code) {
    return $sce.trustAsHtml(html_code);
  };
  
  $scope.resetFocus = function(){
      //console.log("RESET");
      $scope.policyShowState = false;
      $scope.focusQuestion = false;  
  };
 
}]);
app.controller('TopicsCtrl', ['$scope', '$location', '$routeParams', '$route', function ($scope, $location, $routeParams, $route){
  $scope.go = function(path){
      $("body").scrollTop(0);
      $location.path(path);
  };

 
}]);