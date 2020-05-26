(function (window) {
  window.extractData = function () {
    var ret = $.Deferred();

    function onError() {
      console.log('Loading error', arguments);
      ret.reject();
    }

    function onReady(smart) {

      if (smart.hasOwnProperty('tokenResponse')) {
        var encounter = smart.tokenResponse.encounter;
      }

      if (smart.hasOwnProperty('patient')) {
        var patient = smart.patient;
        var pt = patient.read();

        var procs = smart.patient.api.fetchAll({
          type: 'Procedure',
          encounter: "Encounter/" + encounter
        });

        if (!procs || (procs && procs.length > 0)) {
          procs = smart.patient.api.fetchAll({
            type: 'Procedure'
          });
        }

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
          const procedureCodeHeader = "<th>Procedure Code: </th>";
          const procedureStatusHeader = "<th>Status: </th>";
          const procedureEncounterHeader = "<th>Encounter Reference: </th>";
          const rowEnd = "</tr>"
          const cellStart = "<td>";
          const finalRowStart = "<tr class='lastRow'>"
          const cellEnd = "</td>";

          if (procs) {
            procedureData = rowStart + "Found Procedure(s):" + rowEnd;

            for (i = 0; i < procs.length; i++) {
              procedureData += rowStart + procedureIdHeader + cellStart + procs[i].id + cellEnd + rowEnd;
              procedureData += rowStart + procedureEncounterHeader + cellStart + procs[i].encounter.reference + cellEnd + rowEnd;
              procedureData += rowStart + procedureCodeHeader + cellStart + procs[i].code.coding[0].code +
                "<i> - " + procs[i].code.coding[0].display + "</i>" + cellEnd + rowEnd;
              procedureData += finalRowStart + procedureStatusHeader + cellStart + procs[i].status + cellEnd + rowEnd;
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

          if (encounter) {
            p.encounter = encounter;
          }

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
      procedures: { value: '' },
      encounter: { value: '' }
    };
  }

  window.drawVisualization = function (p) {
    $('#holder').show();
    $('#loading').hide();
    $('#encounter').html(p.encounter);
    $('#fname').html(p.fname);
    $('#lname').html(p.lname);
    $('#gender').html(p.gender);
    $('#birthdate').html(p.birthdate);
    $('#height').html(p.height);
    $('#procedures').html(p.procedures);
    document.title = "Case# - " + p.lname;
  };

})(window);
