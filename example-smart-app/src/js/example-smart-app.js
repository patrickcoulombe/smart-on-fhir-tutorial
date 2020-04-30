(function (window) {
  window.extractData = function () {
    var ret = $.Deferred();

    function onError() {
      console.log('Loading error', arguments);
      ret.reject();
    }

    function onReady(smart) {
      if (smart.hasOwnProperty('patient')) {
        var patient = smart.patient;
        var pt = patient.read();

        var procs = smart.patient.api.fetchAll({
          type: 'Procedure' 
        });

        $.when(pt, procs).fail(onError);

        $.when(pt, procs).done(function (patient, procs) {
          var gender = patient.gender;
          var procedureData = '';

          var fname = '';
          var lname = '';

          if (typeof patient.name[0] !== 'undefined') {
            fname = patient.name[0].given.join(' ');
            lname = patient.name[0].family.join(' ');
          }

          const rowStart = "<tr>";
          const procedureIdHeader = "<th>Procedure ID: </th>";
          const procedureExtIdHeader = "<th>External Identifier: </th>";
          const procedureCodeHeader = "<th>Procedure Code: </th>";
          const procedureStatusHeader = "<th>Status: </th>";
          const rowEnd = "</tr>"
          const cellStart = "<td>";
          const cellEnd = "</td>";

          if (procs) {
            procedureData = rowStart + "Found Procedure(s):" + rowEnd;

            for (i = 0; i < procs.length; i++) {
              procedureData += rowStart + procedureIdHeader + cellStart + procs[i].id + cellEnd + rowEnd;
              procedureData += rowStart + procedureExtIdHeader + cellStart +  procs[i].identifier + cellEnd + rowEnd;
              procedureData += rowStart + procedureCodeHeader + cellStart + procs[i].code.coding + cellEnd + rowEnd;
              procedureData += rowStart + cellStart + procs[i].code.display + cellEnd + rowEnd;
              procedureData += rowStart + cellStart + procedureStatusHeader + procs[i].status + cellEnd + rowEnd;
              procedureData += rowStart + rowEnd;
            }
          } else {
            procedureData = "Could not find any Procedures for this patient."
          }

          var p = defaultPatient();
          p.birthdate = patient.birthDate;
          p.gender = gender;
          p.fname = fname;
          p.lname = lname;
          p.procedures = procedureData;

          ret.resolve(p);
        });
      } else {
        onError();
      }
    }

    FHIR.oauth2.ready(onReady, onError);
    return ret.promise();

  };

  function defaultPatient() {
    return {
      fname: { value: '' },
      lname: { value: '' },
      gender: { value: '' },
      birthdate: { value: '' },
      height: { value: '' },
      procedures: { value: '' }
    };
  }

  function getBloodPressureValue(BPObservations, typeOfPressure) {
    var formattedBPObservations = [];
    BPObservations.forEach(function (observation) {
      var BP = observation.component.find(function (component) {
        return component.code.coding.find(function (coding) {
          return coding.code == typeOfPressure;
        });
      });
      if (BP) {
        observation.valueQuantity = BP.valueQuantity;
        formattedBPObservations.push(observation);
      }
    });

    return getQuantityValueAndUnit(formattedBPObservations[0]);
  }

  function getQuantityValueAndUnit(ob) {
    if (typeof ob != 'undefined' &&
      typeof ob.valueQuantity != 'undefined' &&
      typeof ob.valueQuantity.value != 'undefined' &&
      typeof ob.valueQuantity.unit != 'undefined') {
      return ob.valueQuantity.value + ' ' + ob.valueQuantity.unit;
    } else {
      return undefined;
    }
  }

  window.drawVisualization = function (p) {
    $('#holder').show();
    $('#loading').hide();
    $('#fname').html(p.fname);
    $('#lname').html(p.lname);
    $('#gender').html(p.gender);
    $('#birthdate').html(p.birthdate);
    $('#height').html(p.height);
    $('#procedures').html(p.procedures);
    document.title = "Case# - " + p.lname;
  };

})(window);
