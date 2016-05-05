/*globals $, TimelineLite, Elastic, TweenMax */
'use strict';

/**
 * @ngdoc function
 * @name claritystormApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the claritystormApp
 */
angular.module('claritystormApp')
    .controller('MainCtrl', function ($scope) {
        $scope.awesomeThings = [
      'HTML5 Boilerplate',
      'AngularJS',
      'Karma'
    ];

        $scope.$on('$viewContentLoaded', function () {

            var tl = new TimelineLite({
                    //                    onComplete: function() {
                    //                        tl.play(0);
                    //                    }
                }),
                textSeq1 = $('.anim-text'),
                logoSeq1 = $('.letter'),
                vendorSeq1 = $('.vendor'),
                word = $('.word'),
                jumbotron = $('.jumbotron');

            TweenMax.set(jumbotron, {
                perspective: 400
            });

            tl.staggerFrom(logoSeq1, 0.5, {
                y: -50,
                x: 100,
                scale: 0.5,
                opacity: 0,
                delay: 0.5,
                ease: Expo.easeIn,
                force3D: true
            }, 0.1)

            .staggerTo(logoSeq1, 2, {
                delay: 2,
                rotationY: 360
            }, 0)

            .staggerTo(vendorSeq1, 1.5, {
                delay: 2,
                x: -(jumbotron.parent().outerWidth() + 270),
                //left: jumbotron,
                ease: SlowMo.ease.config(0.2, 0.9, false),
                //force3D: true
            }, 1.5);

            tl.pause();
            //window.smokeInit();

            var claritystorm = new Firebase('https://claritystorm.firebaseio.com/');

            claritystorm.child("dataURL/test").on("value", function (snapshot) {
                console.log(snapshot.val());
            });
            
        });

    });