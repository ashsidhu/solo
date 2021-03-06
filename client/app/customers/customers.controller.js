'use strict';

angular.module('spotOnApp')
  .controller('CustomersCtrl', function ($scope, $http, Auth, socket) {
    // populate businesses
    $scope.userBusinesses = [];

    $http.get('/api/businesss/?_ownerId=' + Auth.getCurrentUser()._id).success(function(businesss) {
      $scope.userBusinesses = businesss;
    });

    // select business
    $scope.selectBusiness = function (id) {
      $scope.selectedBusiness = ($scope.selectedBusiness===id) ? null : id;
      $scope.getAppointmentsForBusiness();
    };

    $scope.selectedBusiness = null;

    // select date 
    $scope.today = function () {
      $scope.selectedDate = new Date();
    };
    $scope.today();
    $scope.minDate = new Date();

    // instantiate and populate appointments
    $scope.selectedBusinessAppointments = [];

    $scope.getAppointmentsForBusiness = function () {
      if ($scope.selectedBusiness) {
        $http.get('/api/appointments/?_businessId=' + $scope.selectedBusiness).success(function(appointments) {
          $scope.selectedBusinessAppointments = appointments;
          $scope.populateBookedTimeSlots();
          $scope.populateCustomers();
        });
      } else {
        $scope.selectedBusinessAppointments = [];
      }
    };

    $scope.timeSlots = [9, 10, 11, 12, 13, 14, 15, 16];
    $scope.selectedTimeSlot = null;
    $scope.bookedTimeSlots = [];
    $scope.crm = {}; // timeslot: customer

    $scope.populateBookedTimeSlots = function() {
      $scope.bookedTimeSlots = $scope.selectedBusinessAppointments.filter(function(appointment){
        return ((new Date(appointment.dueDate)).toDateString() === $scope.selectedDate.toDateString());
      }).map(function(appointment) {
        return (new Date(appointment.dueDate)).getHours();
      });
    };

    // populate customer info
    $scope.customers = {};
    $scope.populateCustomers = function() {
      $scope.selectedBusinessAppointments.map(function(appointment){
        return appointment;
      }).forEach(function(appointment){
        var timeslot = (new Date(appointment.dueDate)).getHours();
        var id = appointment._userId;
        $http.get('/api/users/' + id).success(function(user){
          console.log(user)
          $scope.crm[timeslot] = {
            name: user.name,
            email: user.email
          }
        });
      });
    }

    // sockets for appointments
    var tempAppointments = [];
    $http.get('/api/appointments').success(function(appointments) {
      $scope.tempAppointments = appointments;
      socket.syncUpdates('appointment', $scope.tempAppointments, onNewAppointment);
    });

    var onNewAppointment = function (event, item, array) {
      // if appt.businessId is owned by user
      var business = _.find($scope.userBusinesses, {_id: item._businessId});
      if (business) {
        // alert('new appointment')
        $scope.getAppointmentsForBusiness();
      }
    }

  });
