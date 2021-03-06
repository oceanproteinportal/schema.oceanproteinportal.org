// GLOBALS
//var ontology_title = 'Ocean Protein Portal - Data Type Ontology';
//var voc_base_uri="http://schema.oceanproteinportal.org/v1.0/";
var objectProperties={};
var datatypeProperties={};
var uiLanguage="en-US";
var isValueOfProperty="_:isValueOf";

// Update the termURL
$("#termURL").html(voc_base_uri);

var uiText=[];
uiText["Exact match:"] = "Exact match:";
uiText["Close match:"] = "Close match:";
uiText["Broad match:"] = "Broad match:";
uiText["Related match:"] = "Related match:";
uiText["Subclass of:"] = "Subclass of:";
uiText["Subproperty of:"] = "Subproperty of:";
uiText["Related (within the context of):"] = "Related (within the context of):";
uiText["See also:"] = "See also:";
uiText["Properties of"] = "Properties of";
uiText["A subclass of"] = "A subclass of";
uiText["Has subclasses"] = "Has subclasses";
var graph='';
var context='';
var nodeTypes;

// Update the termURL
$("#termURL").html(voc_base_uri);

// Get the vocabulary.
$(function() {
  $.ajax({
      method: "GET",
      cache: true,
      url: $("#vocab").attr('src'),
      dataType: "text"
  }).done(function(data, textStatus, jqXHR){
    displayVocabulary(data);
  }).fail(function(jqXHR, textStatus, errorThrown){
    alert("Could not load the vocabulary: " + $("#vocab").attr('src'));
  });
});

function viewDiagram() {
  var $img = $('#diagram-image');
  var $link = $('#view-diagram');
  if ( $img.is(":visible") ) {
    $link.text('View Diagram');
    $img.hide();
  } else {
    $link.text('Hide Diagram');
    $img.show();
  }
}

function doSearch() {
  var searchTerm=$('#searchTerm').val();
  searchTerm=searchTerm.replace(/[ ]+$/,"");
  searchTerm=searchTerm.replace(/^[ ]+/,"");

  var searchTermLC=searchTerm.toLowerCase();
  var classes={};
  var properties={};
  var namedIndividuals={};
  var datatypes={};
  var parameters={};

  var foundClass=false;
  var foundProperty=false;
  var foundNamedIndividuals=false;
  var foundDataType=false;
  var foundParameter=false;
  $.each(graph, function( index, value ) {
    var id=value["@id"];
    var type=value["@type"] || [];
    var label=value["rdfs:label"];
    var comment=value["rdfs:comment"] || [];
    var prefLabel=value["skos:prefLabel"] || [];
    var labelvalue=selectLanguage(label,uiLanguage);
    var commentvalue=selectLanguage(comment,uiLanguage);
    var haystack=(labelvalue+"\t"+commentvalue+"\t"+prefLabel+"\t"+id).toLowerCase();
    if (haystack.indexOf(searchTermLC) > -1) {
      var detType=determineType(id);
      switch(detType) {
        case "Class":
          classes[id]=value;
          foundClass=true;
          break;
        case "property":
          properties[id]=value;
          foundProperty=true;
          break;
        case "NamedIndividual":
          namedIndividuals[id]=value;
          foundNamedIndividuals=true;
          break;
        case "DataType":
          datatypes[id]=value;
          foundDataType=true;
          break;
        case "Parameter":
          parameters[id]=value;
          foundParameter=true;
          break;
      }
    }

  });

  if (foundClass) {
    var tableContents=tabulateClasses(classes);
    $("#classResultsDetails").html(tableContents);
    $("#classResults").show();
  } else {
    $("#classResults").hide();
  }

  if (foundProperty) {
    var tableContents=tabulateProperties(properties,true,true);
    $("#propertyResultsDetails").html(tableContents);
    $("#propertyResults").show();
  } else {
    $("#propertyResults").hide();
  }

  if (foundNamedIndividuals) {
    var tableContents=tabulateNamedIndividuals(namedIndividuals);
    $("#namedIndividualResultsDetails").html(tableContents);
    $("#namedIndividualResults").show();
  } else {
    $("#namedIndividualResults").hide();
  }

  if (foundDataType) {
    var tableContents=tabulateDataTypes(datatypes);
    $("#datatypeResultsDetails").html(tableContents);
    $("#datatypeResults").show();
  } else {
    $("#datatypeResults").hide();
  }

  if (foundParameter) {
    var tableContents=tabulateInstances(parameters);
    $("#parameterResultsDetails").html(tableContents);
    $("#parameterResults").show();
  } else {
    $("#parameterResults").hide();
  }

  if (foundClass || foundProperty || foundNamedIndividuals || foundDataType || foundParameter ) {
    $(".searchresults").show();
  }
}

function getAllClasses() {
  var classes={};
  $.each(graph, function( index, value ) {
    var id=value["@id"];
    var type=value["@type"] || [];
    if ((type.indexOf("owl:Class") > -1) && (id.substring(0,2) !== "_:")) {
      classes[id]=value;
    }
  });
  //console.log(classes);
  return classes;
}

function getAllProperties() {
  var properties={};
  $.each(graph, function( index, value ) {
    var id=value["@id"];
    var type=value["@type"] || [];
    if (type.indexOf("rdf:Property") > -1 || type.indexOf("owl:ObjectProperty") > -1 || type.indexOf("owl:DatatypeProperty") > -1) {
      properties[value["@id"]]=value;
    }
  });
  //console.log(properties);
  return properties;
}

function getAllNamedIndividuals() {
  var namedIndividuals={};
  $.each(graph, function( index, value ) {
    var id=value["@id"];
    var type=value["@type"] || [];
    if (type.indexOf("owl:NamedIndividual") > -1) {
      namedIndividuals[value["@id"]]=value;
    }
  });
  //console.log(namedIndividuals);
  return namedIndividuals;
}

function getAllDataTypes() {
  var datatypes={};
  $.each(graph, function( index, value ) {
    var id=value["@id"];
    var type=value["rdf:subClassOf"] || [];
    if ((type !== null) && (type["@id"]=="opp:DataType")) {
      datatypes[value["@id"]]=value;
    }
  });
  return datatypes;
}

function getAllParameters() {
  var parameters={};
  $.each(graph, function( index, value ) {
    var id=value["@id"];
    var type=value["rdf:subClassOf"] || [];
    if ((type !== null) && (type["@id"]=="odo:Parameter")) {
      parameters[value["@id"]]=value;
    }
  });
  return parameters;
}

function getLinkedIDarray(obj,filter) {
  var r=[];
  if ((obj !== undefined) && (obj !== null)) {
    if (obj["@id"] !== undefined) {
      if (obj["@id"].indexOf(filter) > -1) {
        r.push(prepareLink(obj["@id"]));
      }
    } else {
      $.each(obj, function( index, value ) {
        if (value["@id"].indexOf(filter) > -1) {
          r.push(prepareLink(value["@id"]));
        }
      });
    }
  }
  return r;
}

function getSubClasses(val) {
  // get class nodes that are subclasses of specified class
  return getNodes(val,"rdfs:subClassOf");
}

function getProperties(val) {
  // get property nodes that have specified class as their domain
  return getNodes(val,"rdfs:domain");
}

function getProperties2(term) {
  var props={};
  $.each(getAllProperties(), function( index, value ) {
    var d = value["rdfs:domain"];
    var fdl = getFlatDomainList(d);
    if (fdl.indexOf('"'+term+'"') > -1) {
      props[index]=value;
    }
  });
  return props;
}

function getNamedIndividualProperties(ni, term) {
  var props={};
  $.each(ni, function( key, val ) {
    if (!key.startsWith("rdf") && !key.startsWith("@")) {
      props[key]=val;
    }
  });
  var isValueOf = {};
  $.each(graph, function( index, resource ) {
    $.each(resource, function( key, val ) {
      var resource_id = resource["@id"] || "";
      if (!resource_id.startsWith('_:')) {
        if(Array.isArray(val)) {
          $.each(val, function ( i, ref ) {
            if (typeof ref === "object") {
              var ref_id = ref["@id"] || "";
              if (ref_id == term) {
                if (undefined == isValueOf[key]) {
                  isValueOf[key] = [];
                }
                isValueOf[key].push(resource_id);
              }
            }
          });
        } else if (typeof val === "object") {
          var ref_id = val["@id"] || "";
          if (ref_id == term) {
            if (undefined == isValueOf[key]) {
              isValueOf[key] = [];
            }
            isValueOf[key].push(resource_id);
          }
        }
      }
    });
  });
  if(!isEmptyObject(isValueOf)) {
    props[isValueOfProperty] = isValueOf;
  }
  return props;
}

function getPropertiesOfType(val) {
  // get property nodes that have specified class as their domain
  return getNodes(val,"rdfs:range");
}

function getOfType(val) {
  // get property nodes of specified type
  return getNodes2(val,"@type");
}

function getNodeTypes() {
  var nodetypes={};
  $.each(graph, function( index, value ) {
    var id=value["@id"];
    var type=value["@type"] ;
    var parent=value["rdfs:subClassOf"] || [];
    var parentName=parent["@id"] ;
    var ubertype = type || parentName;
    nodetypes[id]=ubertype;
  });
  return nodetypes;
}

function getNode(val) {
  var nodes={};
  $.each(graph, function( index, value ) {
    var id=value["@id"];
    if (id == val) {
      nodes[value["@id"]]=value;
    }
  });
  return nodes;
}

function getSuperClasses(val) {
  var superclasses=[];
  $.each(graph, function( index, value ) {
    var id=value["@id"];
    if (id == val) {
      var parent=value["rdfs:subClassOf"] || [];
      var parentName=parent["@id"] || "";
      superclasses.push(parentName);
    }
  });

  return superclasses;
}

function getNodes(val,predicate) {
  // builds an object (associative array) {@nodeid: node} for all matching nodes where nodeid predicate val
  var nodes={};
  $.each(graph, function( index, value ) {
    var id=value["@id"];
    var node=value[predicate] || [];
    if (Array.isArray(node)) {
      $.each(node, function( index, nodeEl ) {
        var nodeName = nodeEl["@id"] || "";
        if (nodeName == val) {
          nodes[value["@id"]]=value;
        }
      });
    } else {
      var nodeName = node["@id"] || "";
      if (nodeName == val) {
        nodes[value["@id"]]=value;
      }
    }
  });
  return nodes;
}

function getNodes2(val,predicate) {
  // builds an object (associative array) {@nodeid: node} for all matching nodes where nodeid predicate val
  var nodes={};
  $.each(graph, function( index, value ) {
    var id=value["@id"];
    var node=value[predicate] || [];
    if (Array.isArray(node)) {
      $.each(node, function( index, nodeEl ) {
        var nodeName = nodeEl["@id"] || "";
        if (nodeName == val) {
          nodes[value["@id"]]=value;
        }
      });
    } else {
      if (node == val) {
        nodes[value["@id"]]=value;
      }
    }
  });
  return nodes;
}

function listValues(obj) {
  var sortedKeys=Object.keys(obj).sort();
  $.each(sortedKeys, function(index,keyname) {
    var value=obj[keyname];
  });
}

function listObject(obj) {
  var sortedKeys=Object.keys(obj).sort();
  $.each(sortedKeys, function(index,keyname) {
    var value=obj[keyname];
  });
}

function listArray(obj) {
  $.each(obj, function(index,value) {

  });
}

function listProperties(obj) {
  var sortedKeys=Object.keys(obj).sort();
  $.each(sortedKeys, function(index,keyname) {
    var value=obj[keyname];
    var range=value["rdfs:range"] || [];
  });
}

function listClasses(obj) {
  var sortedKeys=Object.keys(obj).sort();
  $.each(sortedKeys, function(index,keyname) {
    var value=obj[keyname];
    var parent=value["rdfs:subClassOf"] || [];
    var parentClassName = parent["@id"] || "";
    if (parentClassName !== "") {
      var scNote=uiText["A subclass of"]+" "+prepareLink(parentClassName);
      $("#subclassNote").html(scNote);
      $("#subclassNote").show();
    } else {
      $("#subclassNote").hide();
    }
  });
}

function getSingleNode(val) {
  var rtnval=null;
  var found=false;
  $.each(graph, function( index, value ) {
    var id=value["@id"];
    if (id == val) {
      found=true;
      rtnvalue=value;
    }
  });
  if (!found) {
    rtnvalue=null;
  }
  return rtnvalue;
}

function prepareLink(val, label = '') {
  var url;
  var target;
  var link=val;
  if (label == '') {
    label = val;
  }
  if ((val !== undefined) && (val !== null)) {
    if (val.indexOf(voc_base_uri) == 0) {
      var re = new RegExp(voc_base_uri, "g");
      url = val.replace(re, "");
      link='<a href="'+url+'" class="link">opp:'+url+'</a>';
    }
    if (val.indexOf("opp:") == 0) {
      url=val.replace(/^opp:/g , "");
      link='<a href="'+url+'" class="link">'+label+'</a>';
    }
    else {
      var expanded = expandPrefix(val);
      //console.log(val + ' -> ' + expanded);
      if (expanded == val) {
        // Not expanded
      }
      else {
        // Expanded
        link='<a href="'+expanded+'"  class="link" target="_blank">'+label+'</a>';
      }
    }
  }
  return link;
}

function determineType(val) {
  var type=null;
  var first=nodeTypes[val] || "";
  var second=nodeTypes[first] || "";
  if ( (first.indexOf('owl:Class') > -1) || (first.indexOf('rdfs:Class') > -1 ) ) {
    type="Class";
  }
  if ( (first.indexOf('rdf:Property') > -1) || (first.indexOf('owl:ObjectProperty') > -1) || (first.indexOf('owl:DatatypeProperty') > -1) ) {
    type="property";
  }
  if ( first.indexOf('owl:NamedIndividual') > -1 ) {
    type="NamedIndividual";
  }
  if ( first.indexOf('odo-dt:DataType') > -1  ) {
    type="DataType";
  }

  if ( second.indexOf('odo:Parameter') > -1  ) {
    type="Parameter";
  }
  return type;
}

function tabulateRange(obj) {
  var tableContents="";
  var tableRow="";
  var range = obj["rdfs:range"];
  if ( range instanceof Array) {
    $.each(range, function( index, value ) {
    var rangeid=value["@id"] || [];
    tableRow+="<tr><td>"+prepareLink(rangeid)+"</td></tr>";
    tableContents+=tableRow;
    });
  } else {
    var rangeid=range["@id"] || [];
    tableRow="<tr><td>"+prepareLink(rangeid)+"</td></tr>";
    tableContents=tableRow;
  }
  return tableContents;
}

function getFlatDomainList(domain) {
  var rv=[];
  if (domain["@id"] !== undefined) {
    if  (domain["@id"].substring(0,2) == "_:" ) {
      var blanknode = domain["@id"];
      var struc = getNode(blanknode)[blanknode]["owl:unionOf"]["@list"];
      $.each(struc, function( index, value ) {
      rv.push(value["@id"]);
      });
    } else {
      rv.push(domain["@id"]);
    }
  }

  if (domain["owl:unionOf"] !== undefined) {
    $.each(domain["owl:unionOf"]["@list"], function( index, value ) {
      rv.push(value["@id"]);
    });
  }

  return JSON.stringify(rv.sort());
}

function tabulateDomain(obj) {
  var tableContents=[];
  var tableRow="";
  var domain = obj["rdfs:domain"];

  if (domain["@id"] !== undefined) {
    if  (domain["@id"].substring(0,2) == "_:" ) {
      var blanknode = domain["@id"];
      var struc = getNode(blanknode)[blanknode]["owl:unionOf"]["@list"];
      $.each(struc, function( index, value ) {
        tableRow="<tr><td>"+prepareLink(value["@id"])+"</td></tr>";
        tableContents.push(tableRow);
      });
    } else {
      tableRow="<tr><td>"+prepareLink(domain["@id"])+"</td></tr>";
      tableContents.push(tableRow);
    }
  }

  if (domain["owl:unionOf"] !== undefined) {
    $.each(domain["owl:unionOf"]["@list"], function( index, value ) {
      tableRow="<tr><td>"+prepareLink(value["@id"])+"</td></tr>";
      tableContents.push(tableRow);
    });
  }

  return tableContents.join("<br>");
}

function tabulateSiblings(obj) {
  var tableContents="";
  var selfid=obj["@id"];
  var domain = obj["rdfs:domain"]["@id"];
  var fdl1 = getFlatDomainList(obj["rdfs:domain"]);
  var range = obj["rdfs:range"]["@id"];
  var sibling={};
  $.each(graph, function( index, value ) {
    var id=value["@id"];
    var r=value["rdfs:range"] || [];
    var d=value["rdfs:domain"] || [];
    var fdl2=getFlatDomainList(d);

    if ((range == r["@id"]) && ( (fdl1 == fdl2) ) && (id !== selfid)) {
      sibling[id]=value;
    }
  });

  var sortedKeys=Object.keys(sibling).sort();
  $.each(sortedKeys, function(index,keyname) {
    var tableRow="";
    var value=sibling[keyname];
    var comment=value["rdfs:comment"] || [];
    var url=value["@id"] || "";
    var label=value["rdfs:label"];
    var range=value["rdfs:range"]["@id"] || "";

    tableRow+='<tr>';
    tableRow+='<td class="firstCol3">'+selectLanguage(label,uiLanguage)+'<div class="code-value-uri">'+prepareLink(url)+'</div></td>';
    tableRow+='<td class="secondCol3">'+prepareLink(range)+'</td>';
    tableRow+='<td property="rdfs:comment" class="thirdCol3">'+selectLanguage(comment,uiLanguage);
    tableRow+='</td>';
    tableRow+='</tr>';
    tableContents+=tableRow;
  });

  return tableContents;
}

function prepareSubclassList(obj) {
  var list=[];
  var sortedKeys=Object.keys(obj).sort();
  $.each(sortedKeys, function(index,keyname) {
    var url=keyname;
    if (url !== null) {
      list.push(prepareLink(url));
    }
  });
  return list.join(", ");
}

function tabulateSubclasses(obj) {
  var tableContents="";
  var sortedKeys=Object.keys(obj).sort();
  $.each(sortedKeys, function(index,keyname) {
    var tableRow="";
    var value=obj[keyname];
    var label=value["rdfs:label"];
    var url=value["@id"];
    var comment=value["rdfs:comment"] || [];
    tableRow+='<tr about="'+url+'" rev="rdfs:subClassOf">';
    tableRow+='<td property="rdfs:label" class="firstCol3">'+selectLanguage(label,uiLanguage)+'</td>';
    tableRow+='<td class="secondCol3">'+prepareLink(url)+'</td>';
    tableRow+='<td property="rdfs:label" class="thirdCol3">'+selectLanguage(comment,uiLanguage)+'</td>';
    tableRow+='</tr>';
    tableContents+=tableRow;
  });
  return tableContents;
}

function tabulateSuperclasses(obj) {
  var tableContents="";
  if (obj instanceof Array) {
    $.each(obj, function(index,value) {
      var tableRow="";
      var node=getSingleNode(value);
      if (node !== null) {
        var label=node["rdfs:label"];
        var url=node["@id"];
        var comment=node["rdfs:comment"] || [];
        tableRow+='<tr about="'+url+'" property="rdfs:subClassOf">';
        tableRow+='<td property="rdfs:label" class="firstCol3">'+selectLanguage(label,uiLanguage)+'</td>';
        tableRow+='<td class="secondCol3">'+prepareLink(url)+'</td>';
        tableRow+='<td property="rdfs:label" class="thirdCol3">'+selectLanguage(comment,uiLanguage)+'</td>';
        tableRow+='</tr>';
        tableContents+=tableRow;
      }
    });
  } else {
    var node=getSingleNode(obj);
    if (node !== null) {
      var label=node["rdfs:label"];
      var url=node["@id"];
      var comment=node["rdfs:comment"] || [];
      var tableRow="";
      tableRow+='<tr about="'+url+'" property="rdfs:subClassOf">';
      tableRow+='<td property="rdfs:label" class="firstCol3">'+selectLanguage(label,uiLanguage)+'</td>';
      tableRow+='<td class="secondCol3">'+prepareLink(url)+'</td>';
      tableRow+='<td property="rdfs:label" class="thirdCol3">'+selectLanguage(comment,uiLanguage)+'</td>';
      tableRow+='</tr>';
      tableContents+=tableRow;
    }
  }
  return tableContents;
}

function tabulateClasses(obj) {
  var tableContents="";
  var sortedKeys=Object.keys(obj).sort();
  $.each(sortedKeys, function(index,keyname) {
    var tableRow="";
    var value=obj[keyname];
    var comment=value["rdfs:comment"] || [];
    var url=value["@id"] || "";
    var label=value["rdfs:label"];

    tableRow+='<tr>';
    tableRow+='<td class="firstCol2">'+prepareLink(url)+'</td>';
    tableRow+='<td property="rdfs:comment" class="secondCol2">'+selectLanguage(comment,uiLanguage);
    tableRow+='</td>';
    tableRow+='</tr>';
    tableContents+=tableRow;
  });
  return tableContents;
}
function tabulateNamedIndividuals(obj) {
  var tableContents="";
  var sortedKeys=Object.keys(obj).sort();
  $.each(sortedKeys, function(index,keyname) {
    var tableRow="";
    var value=obj[keyname];
    var comment=value["rdfs:comment"] || [];
    var url=value["@id"] || "";
    var label=value["rdfs:label"];
    var types = "";
    $.each(value["@type"], function (index, type) {
      if (type != "owl:NamedIndividual") {
        types += type + '</br>';
      }
    });

    tableRow+='<tr>';
    //tableRow+='<td class="firstCol2">'+prepareLink(url)+'</td>';
    tableRow+='<td class="firstCol2">'+selectLanguage(label,uiLanguage)+'<div class="code-value-uri">'+prepareLink(url)+'</div>'+'</td>';
    tableRow+='<td class="thirdCol3">'+types+'</td>';
    tableRow+='<td class="secondCol2">'+selectLanguage(label,uiLanguage);
    tableRow+='</td>';
    tableRow+='</tr>';
    tableContents+=tableRow;
  });
  return tableContents;
}

function tabulateDataTypes(obj) {
  var tableContents="";
  var sortedKeys=Object.keys(obj).sort();
  $.each(sortedKeys, function(index,keyname) {
    var tableRow="";
    var value=obj[keyname];
    var comment=value["rdfs:comment"] || [];
    var url=value["@id"] || "";
    var label=value["rdfs:label"];

    tableRow+='<tr>';
    tableRow+='<td class="firstCol2">'+prepareLink(url)+'</td>';
    tableRow+='<td class="secondCol2">'+selectLanguage(label,uiLanguage);
    tableRow+='</td>';
    tableRow+='</tr>';
    tableContents+=tableRow;
  });
  return tableContents;
}

function populateBreadcrumbTrail(val,type,node,label) {
  var html="";
  switch (type) {
    case "Class" :
      html+='<li><a href="./" class="link">'+ontology_title+'</a></li>';
      html+='<li><a href="./?show=classes" class="link">All Classes</a></li>';
      html+='<li id="currentClass">'+label+'</li>';
      break;
    case "property" :
      html+='<li><a href="./" class="link">'+ontology_title+'</a></li>';
      html+='<li><a href="./?show=properties" class="link">All Properties</a></li>';
      html+='<li id="currentClass">'+label+'</li>';
      break;
    case "NamedIndividual" :
      html+='<li><a href="./" class="link">'+ontology_title+'</a></li>';
      html+='<li><a href="./?show=namedindividuals" class="link">All Named Individuals</a></li>';
      html+='<li id="currentClass">'+label+'</li>';
      break;
    case "DataType" :
      html+='<li><a href="./" class="link">'+ontology_title+'</a></li>';
      html+='<li><a href="./?show=datatypes" class="link">Data Types</a></li>';
      html+='<li id="currentClass">'+label+'</li>';
      break;
    case "Parameter" :
      html+='<li><a href="./" class="link">'+ontology_title+'</a></li>';
      html+='<li><a href="./?show=parameters" class="link">Parameters</a></li>';
      html+='<li id="currentClass">'+label+'</li>';
  }
  $("#breadcrumbTrail").html(html);
}

function tabulateProperties(obj,linkMiddle,includeMiddle) {
  var tableContents="";
  var sortedKeys=Object.keys(obj).sort();
  if (includeMiddle) {
    numcols=3;
    finalcolumn="thirdCol3";
  } else {
    numcols=2;
    finalcolumn="secondCol2";
  }

  $.each(sortedKeys, function(index,keyname) {
    var tableRow="";
    var value=obj[keyname];
    var range= [];
    /*
    if (value["rdfs:range"] == undefined) {
      //console.log(value);
    }
    */
    var range=value["rdfs:range"]["@id"] || [];
    var comment=value["rdfs:comment"] || [];
    var url=value["@id"] || "";
    var label=value["rdfs:label"];

    tableRow+='<tr typeof="rdf:Property" resource="'+url+'">';
    tableRow+='<td property="rdfs:label" class="firstCol'+numcols+'">'+selectLanguage(label,uiLanguage)+'<div class="code-value-uri">'+prepareLink(url)+'</div>'+'</td>';
    if (includeMiddle) {
      tableRow+='<td property="schema:rangeIncludes" class="secondCol'+numcols+'">';
      if (linkMiddle) {
        tableRow+=prepareLink(range);
      } else {
        tableRow+=range;
      }
      tableRow+='</td>';
    }
    tableRow+='<td property="rdfs:comment" class="'+finalcolumn+'">'+selectLanguage(comment,uiLanguage);
    tableRow+='</td>';
    tableRow+='</tr>';
    tableContents+=tableRow;
  });
  return tableContents;
}

function tabulateInstances(obj) {
  var tableContents="";
  var sortedKeys=Object.keys(obj).sort();
  $.each(sortedKeys, function(index,keyname) {
    var tableRow="";
    var value=obj[keyname];
    var url=value["@id"] || "";
    var label=value["rdfs:label"];
    var comment=value["rdfs:comment"];
    var skosPrefLabel=value["skos:prefLabel"];
    var commentText=selectLanguage(comment,uiLanguage);
    if (commentText !== "") {
      commentText+="<br>";
    }
    tableRow+='<tr>';
    tableRow+='<td class="firstCol3">'+skosPrefLabel+'</td>';
    tableRow+='<td class="secondCol3">'+selectLanguage(label,uiLanguage)+'</td>';
    tableRow+='<td class="thirdCol3">'+commentText+'<div class="code-value-uri">'+prepareLink(url)+'</div>';
    tableRow+='</td>';
    tableRow+='</tr>';
    tableContents+=tableRow;
  });
  return tableContents;
}

function tabulateNamedIndividualProperties(obj) {
  var tableContents="";
  var sortedKeys=Object.keys(obj).sort();
  var isValueOf = null;
  $.each(sortedKeys, function(index,keyname) {
    if (keyname == isValueOfProperty) {
      isValueOf = obj[keyname];
    }
    else {
      var tableRow="";
      var resource="";
      var value=obj[keyname];
      if (Array.isArray(value)) {
        $.each(value, function( index, item ) {
          resource += prepareLink(item["@id"]) + "<br/>";
        });
      }
      else {
        resource=prepareLink(value["@id"] || "");
      }
      tableRow+='<tr>';
      tableRow+='<td class="firstCol3">'+prepareLink(keyname)+'</td>';
      tableRow+='<td class="thirdCol3"><div class="code-value-uri">'+resource+'</div>';
      tableRow+='<td class="thirdCol3"><div class="code-value-uri"></div>';
      tableRow+='</td>';
      tableRow+='</tr>';
      //console.log("named individual: " + keyname);
      tableContents+=tableRow;
    }
  });
  if (undefined != isValueOf) {
    $.each(isValueOf, function (property, ids) {
      var tableRow="";
      var resource="";
      $.each(ids, function( index, item ) {
        resource += prepareLink(item) + "<br/>";
      });
      tableRow+='<tr>';
      tableRow+='<td class="firstCol3">'+prepareLink(property)+'</td>';
      tableRow+='<td class="thirdCol3"><div class="code-value-uri"></div>';
      tableRow+='<td class="thirdCol3"><div class="code-value-uri">'+resource+'</div>';
      tableRow+='</td>';
      tableRow+='</tr>';
      //console.log("isValueOf: " + property);
      tableContents+=tableRow;
    });
  }
  return tableContents;
}

function expandPrefix(val) {
  var prefix = val.split(":", 1);
  if (prefix == val) {
    return val;
  }
  if(undefined != context[prefix]) {
    var re = new RegExp(prefix+":", "g");
    return val.replace(re, context[prefix]);
  }
  return val;
}

function selectLanguage(obj,langTag) {
  var r="";
  if ((obj !== undefined) && (obj !== null)) {
    if (obj instanceof Array) {
      $.each(obj, function( index, value ) {
        if (value["@language"]==langTag) {
          r = value["@value"];
        }
      });
    } else {
      if (obj["@language"] == langTag) {
        r = obj["@value"];
      }
    }
  }
  return r;
}

function updatestate2(val) {
  val = val.replace(/^\.\//g,"");
  if (val == "") {
    $(document).prop('title', ontology_title);
    $("#termName").html(ontology_title);
    $('#breadcrumbTrail').html('<li id="currentClass">'+ontology_title+'</li>');
    $('#breadcrumbTrail').show();
    $('#intro').show();
    $('#termComment').html('');
    $('#termComment').hide();
    $('#termURL').html(voc_base_uri);
    $('#allClasses').hide();
    $('#allProperties').hide();
    $('#allNamedIndividuals').hide();
    $('#allDataTypes').hide();
    $('#allParameters').hide();
    $("#propertiesOfNI").hide();
    $('#propertiesOfClass').hide();
    $('#propertiesOfParentClass').hide();
    $('#propertiesOfGrandparentClass').hide();
    $('#definedparameters').hide();
    $('#subclasses').hide();
    $('#superclasses').hide();
    $('#havingrangeinfo').hide();
    $('#siblinginfo').hide();
    $('#rangeinfo').hide();
    $('#domaininfo').hide();
    $('#triple').hide();
    $("#superclassNote").hide();
    $("#subclassNote").hide();
    $(".termschema").hide();
  } else {
    $(document).prop('title', 'opp:'+val);
    $('#intro').hide();
    $('#termComment').show();
    $('#breadcrumbTrail').show();
    $("#termName").html(val);
    var term="opp:"+val;
    var node=getSingleNode(term);
    var type=determineType(term);
    if (node !== null) {
      var termURL=expandPrefix(node["@id"]);
      $("#termURL").html(termURL);
      var termComment = node["rdfs:comment"];
      var termLabel = node["rdfs:label"];
      var label = selectLanguage(termLabel,uiLanguage)
      $("#termName").html(label);
      populateBreadcrumbTrail(val,type,node,label);
    } else {
      switch(val) {
        case "?show=classes":
          $('#triple').hide();
          $('#termComment').hide();
          $('#termURL').html(voc_base_uri);
          $('#allClasses').show();
          $('#allProperties').hide();
          $('#allNamedIndividuals').hide();
          $("#propertiesOfNI").hide();
          $('#allDataTypes').hide();
          $('#allParameters').hide();
          $('#propertiesOfClass').hide();
          $('#propertiesOfParentClass').hide();
          $('#propertiesOfGrandparentClass').hide();
          $('#definedparameters').hide();
          $('.searchresults').hide();
          $(".termschema").hide();
          $('#subclassNote').hide();
          $('#superclassNote').hide();
          $("#termName").html("All Classes");
          $('#breadcrumbTrail').html('<li><a href="./" class="link">'+ontology_title+'</a></li><li id="currentClass">All Classes</a></li>');
          var classes=getAllClasses();
          var tableContents=tabulateClasses(classes);
          $("#termMemberDetails1").html(tableContents);
          break;

        case "?show=properties":
          $('#triple').hide();
          $('#termComment').hide();
          $('#termURL').html(voc_base_uri);
          $('#subclassNote').hide();
          $('#superclassNote').hide();
          $('#allClasses').hide();
          $('#allProperties').show();
          $('#allNamedIndividuals').hide();
          $("#propertiesOfNI").hide();
          $('#allDataTypes').hide();
          $('#allParameters').hide();
          $('#propertiesOfClass').hide();
          $('#propertiesOfParentClass').hide();
          $('#propertiesOfGrandparentClass').hide();
          $('#definedparameters').hide();
          $('.searchresults').hide();
          $(".termschema").hide();
          $("#termName").html("All Properties");
          $('#breadcrumbTrail').html('<li><a href="./" class="link">'+ontology_title+'</a></li><li id="currentClass">All Properties</a></li>');
          var properties=getAllProperties();
          var tableContents=tabulateProperties(properties,true,false);
          $("#termMemberDetails2").html(tableContents);
          break;

        case "?show=namedindividuals":
          $('#triple').hide();
          $('#allClasses').hide();
          $('#allProperties').hide();
          $('#allNamedIndividuals').show();
          $("#propertiesOfNI").hide();
          $('#allDataTypes').hide();
          $('#allParameters').hide();
          $('#propertiesOfClass').hide();
          $('#propertiesOfParentClass').hide();
          $('#propertiesOfGrandparentClass').hide();
          $('#definedparameters').hide();
          $('.searchresults').hide();
          $(".termschema").hide();
          $('#termComment').hide();
          $('#subclassNote').hide();
          $('#superclassNote').hide();
          $('#termURL').html(voc_base_uri);
          $("#termName").html("All Named Individuals");
          $('#breadcrumbTrail').html('<li><a href="./" class="link">'+ontology_title+'</a></li><li id="currentClass">All Named Individuals</a></li>');
          var namedIndividuals=getAllNamedIndividuals();
          var tableContents=tabulateNamedIndividuals(namedIndividuals);
          $("#termMemberDetailsNI").html(tableContents);
          break;

        case "?show=datatypes":
          $('#triple').hide();
          $('#allClasses').hide();
          $('#allProperties').hide();
          $('#allNamedIndividuals').hide();
          $("#propertiesOfNI").hide();
          $('#allDataTypes').show();
          $('#allParameters').hide();
          $('#propertiesOfClass').hide();
          $('#propertiesOfParentClass').hide();
          $('#propertiesOfGrandparentClass').hide();
          $('#definedparameters').hide();
          $('.searchresults').hide();
          $(".termschema").hide();
          $('#termComment').hide();
          $('#subclassNote').hide();
          $('#superclassNote').hide();
          $('#termURL').html(voc_base_uri);
          $("#termName").html("All Type Codes");
          $('#breadcrumbTrail').html('<li><a href="./" class="link">'+ontology_title+'</a></li><li id="currentClass">Data Types</a></li>');
          var datatypes=getAllDataTypes();
          var tableContents=tabulateDataTypes(datatypes);
          $("#termMemberDetails3").html(tableContents);
          break;

        case "?show=parameters":
          $('#triple').hide();
          $('#allClasses').hide();
          $('#allProperties').hide();
          $('#allNamedIndividuals').hide();
          $("#propertiesOfNI").hide();
          $('#allDataTypes').hide();
          $('#allParameters').show();
          $('#propertiesOfClass').hide();
          $('#propertiesOfParentClass').hide();
          $('#propertiesOfGrandparentClass').hide();
          $('#definedparameters').hide();
          $('.searchresults').hide();
          $(".termschema").hide();
          $('#termComment').hide();
          $('#subclassNote').hide();
          $('#superclassNote').hide();
          $('#termURL').html(voc_base_uri);
          $("#termName").html("All Type Codes");
          $('#breadcrumbTrail').html('<li><a href="./" class="link">'+ontology_title+'</a></li><li id="currentClass">Parameters</a></li>');
          var parameters=getAllParameters();
          var tableContents=tabulateDataTypes(parameters);
          $("#termMemberDetails3").html(tableContents);
          break;

        default:
          $('#triple').hide();
          $("#termName").html("Not found! ["+val+"]");
          $('#allClasses').hide();
          $('#allProperties').hide();
          $('#allNamedIndividuals').hide();
          $("#propertiesOfNI").hide();
          $('#allDataTypes').hide();
          $('#allParameters').hide();
          $('#propertiesOfClass').hide();
          $('#propertiesOfParentClass').hide();
          $('#propertiesOfGrandparentClass').hide();
          $('#definedparameters').hide();
          break;
      }

      $('#subclasses').hide();
      $('#superclasses').hide();
      $('#havingrangeinfo').hide();
      $('#siblinginfo').hide();
      $('#rangeinfo').hide();
      $('#domaininfo').hide();
    }

    if (type == "Class") {
      var properties=getProperties2(term);
      var tableContents=tabulateProperties(properties,true,true);
      $("#termMemberDetails4").html(tableContents);
      $("#membertableHeader4").html(uiText["Properties of"]+' '+term);

      $("#termComment").html(selectLanguage(termComment,uiLanguage));
      $('#triple').hide();

      var skosExactMatch=getLinkedIDarray(node["skos:exactMatch"],"schema:");
      var skosCloseMatch=getLinkedIDarray(node["skos:closeMatch"],"schema:");
      var skosBroadMatch=getLinkedIDarray(node["skos:broadMatch"],"schema:");
      var skosRelatedMatch=getLinkedIDarray(node["skos:relatedMatch"],"schema:");
      var skosRelated=getLinkedIDarray(node["skos:related"],"schema:");
      var subClassOf=getLinkedIDarray(node["rdfs:subClassOf"],"schema:");
      var seeAlso=getLinkedIDarray(node["rdfs:seeAlso"],"schema:");

      var schemaEquivalent="";

      if (skosExactMatch.length > 0) {
        schemaEquivalent+=uiText["Exact match:"]+" "+skosExactMatch.join(", ")+"<br>";
      }

      if (skosCloseMatch.length > 0) {
        schemaEquivalent+=uiText["Close match:"]+" "+skosCloseMatch.join(", ")+"<br>";
      }

      if (skosBroadMatch.length > 0) {
        schemaEquivalent+=uiText["Broad match:"]+" "+skosBroadMatch.join(", ")+"<br>";
      }

      if (skosRelatedMatch.length > 0) {
        schemaEquivalent+=uiText["Related match:"]+" "+skosRelatedMatch.join(", ")+"<br>";
      }

      if (subClassOf.length > 0) {
        schemaEquivalent+=uiText["Subclass of:"]+" "+subClassOf.join(", ")+"<br>";
      }

      if (skosRelated.length > 0) {
        schemaEquivalent+=uiText["Related (within the context of):"]+" "+skosRelated.join(", ")+"<br>";
      }

      if (seeAlso.length > 0) {
        schemaEquivalent+=uiText["See also:"]+" "+seeAlso.join(", ")+"<br>";
      }

      $("#schemaEquivalent").html(schemaEquivalent);
      if (schemaEquivalent.indexOf('schema:') > -1) {
        $(".termschema").show();
      } else {
        $(".termschema").hide();
      }

      $("#allClasses").hide();
      $("#allProperties").hide();
      $('#allNamedIndividuals').hide();
      $("#propertiesOfNI").hide();
      $("#allDataTypes").hide();
      $('#allParameters').hide();
      $("#propertiesOfClass").show();
      $("#propertiesOfParentClass").hide();
      $("#propertiesOfGrandparentClass").hide();
      $("#definedparameters").hide();

      var subClasses=getSubClasses(term);
      if (Object.keys(subClasses).length > 0) {
        var subclassContents = tabulateSubclasses(subClasses);
        var subclassList = prepareSubclassList(subClasses);
        $("#subclassDetails").html(subclassContents);
        $("#subclassNote").html("&#x21E9; "+uiText["Has subclasses"]+": "+subclassList);
        $("#subclassNote").show();
        $('#subclasses').show();
      } else {
        $("#subclassNote").hide();
        $('#subclasses').hide();
      }

      var superClasses=getSuperClasses(term);
      if ((superClasses.length > 0) && (superClasses[0] !== "")) {
        parentName=superClasses[0];
        if (parentName !== "") {
          var scNote='&#x21E7; '+uiText["A subclass of"]+' '+prepareLink(parentName);
          if (parentName.indexOf("opp:") > -1) {
            $('#propertiesOfParentClass').show();
          }
          $("#superclassNote").html(scNote);
          $("#superclassNote").show();
        } else {
          $("#superclassNote").hide();
        }
      }

      var parentClass="";
      if ((Object.keys(superClasses).length > 0) && (superClasses[0] !== "") && (superClasses[0] !== "owl:Thing")) {
        parentClass=superClasses[0];
        $("#membertableHeader4a").html(uiText["Properties of"]+' '+parentClass);

        var parentProperties=getProperties2(parentClass);
        var tableContents=tabulateProperties(parentProperties,true,true);
        $("#termMemberDetails4a").html(tableContents);
        $("#propertiesOfParentClass").show();

        var grandparentClasses=getSuperClasses(parentClass);
        var grandparentClass="";
        if ((Object.keys(grandparentClasses).length > 0) && (grandparentClasses[0] !== "") && (grandparentClasses[0] !== "owl:Thing")) {
          grandparentClass=grandparentClasses[0];
          $("#membertableHeader4b").html(uiText["Properties of"]+' '+grandparentClass);

          var grandparentProperties=getProperties2(grandparentClass);
          var tableContents=tabulateProperties(grandparentProperties,true,true);
          $("#termMemberDetails4b").html(tableContents);
          $("#propertiesOfGrandparentClass").show();
        }

        var superclassContents = tabulateSuperclasses(superClasses);
        $("#superclassDetails").html('<span rel="rdfs:subClassOf">'+superclassContents+'</span>');
        $('#superclasses').show();
      } else {
        if (superClasses[0] == "owl:Thing") {
          $("#superclassDetails").html('<tr><td class="firstCol3">owl:Thing</td><td class="secondCol3"><a href="http://www.w3.org/2002/07/owl#Thing" target="_blank"  class="link">owl:Thing</a></td><td class="thirdCol3">Thing. The class of OWL individuals.</td></tr>');
          $('#superclasses').show();
        } else {
          $('#superclasses').hide();
        }
      }

      var propertiesHavingThisRange=getPropertiesOfType(term);
      if (Object.keys(propertiesHavingThisRange).length > 0) {
        var havingRangeContents=tabulateProperties(propertiesHavingThisRange,false,true);
        $("#havingRangeDetails").html(havingRangeContents);
        $('#havingrangeinfo').show();
      } else {
        $('#havingrangeinfo').hide();
      }

      $('#rangeinfo').hide();
      $('#domaininfo').hide();
      $('#siblinginfo').hide();
    }

    if (type == "NamedIndividual") {
      $(".termschema").hide();
      $("#termComment").html(selectLanguage(termComment,uiLanguage));
      $('#triple').hide();
      var properties=getNamedIndividualProperties(node, term);
      var tableContents=tabulateNamedIndividualProperties(properties);
      if (!isEmptyObject(properties)) {
        $("#propertiesOfNI").show();
      } else {
        $("#propertiesOfNI").hide();
      }
      $("#termMemberDetailsNIProperties").html(tableContents);
      $('#havingrangeinfo').hide();
      $('#allClasses').hide();
      $('#allProperties').hide();
      $('#allNamedIndividuals').hide();

      $('#allDataTypes').hide();
      $('#allParameters').hide();
      $('#propertiesOfClass').hide();
      $('#propertiesOfParentClass').hide();
      $('#propertiesOfGrandparentClass').hide();
      $('#definedparameters').hide();
      $('#subclasses').hide();
      $('#superclasses').hide();
      $('#rangeinfo').hide();
      $('#domaininfo').hide();
      $('#siblinginfo').hide();
    }

    if (type == "DataType") {
      $("#superclassNote").hide();
      $("#subclassNote").hide();
      $(".termschema").hide();

      $('#triple').hide();
      var instances=getOfType(term);
      var tableContents=tabulateInstances(instances);
      $("#termMemberDetails5").html(tableContents);

      var propertiesHavingThisRange=getPropertiesOfType(term);
      if (Object.keys(propertiesHavingThisRange).length > 0) {
        var havingRangeContents=tabulateProperties(propertiesHavingThisRange,false,true);
        $("#havingRangeDetails").html(havingRangeContents);
        $('#havingrangeinfo').show();
      } else {
        $('#havingrangeinfo').hide();
      }

      $('#allClasses').hide();
      $('#allProperties').hide();
      $("#propertiesOfNI").hide();
      $('#allNamedIndividuals').hide();
      $('#allDataTypes').hide();
      $('#allParameters').hide();
      $('#propertiesOfClass').hide();
      $('#propertiesOfParentClass').hide();
      $('#propertiesOfGrandparentClass').hide();
      $('#definedparameters').show();
      $('#subclasses').hide();
      $('#superclasses').hide();
      $('#rangeinfo').hide();
      $('#domaininfo').hide();
      $('#siblinginfo').hide();
    }

    if (type == "property") {
      $('#triple').show();
      $('#superclassNote').hide();
      $('#subclassNote').hide();

      var skosExactMatch=getLinkedIDarray(node["skos:exactMatch"],"schema:");
      var skosCloseMatch=getLinkedIDarray(node["skos:closeMatch"],"schema:");
      var skosBroadMatch=getLinkedIDarray(node["skos:broadMatch"],"schema:");
      var skosRelatedMatch=getLinkedIDarray(node["skos:relatedMatch"],"schema:");
      var skosRelated=getLinkedIDarray(node["skos:related"],"schema:");
      var subPropertyOf=getLinkedIDarray(node["rdfs:subPropertyOf"],"schema:");
      var seeAlso=getLinkedIDarray(node["rdfs:seeAlso"],"schema:");

      var schemaEquivalent="";

      if (skosExactMatch.length > 0) {
        schemaEquivalent+=uiText["Exact match:"]+" "+skosExactMatch.join(", ")+"<br>";
      }

      if (skosCloseMatch.length > 0) {
        schemaEquivalent+=uiText["Close match:"]+" "+skosCloseMatch.join(", ")+"<br>";
      }

      if (skosBroadMatch.length > 0) {
        schemaEquivalent+=uiText["Broad match:"]+" "+skosBroadMatch.join(", ")+"<br>";
      }

      if (skosRelatedMatch.length > 0) {
        schemaEquivalent+=uiText["Related match:"]+" "+skosRelatedMatch.join(", ")+"<br>";
      }

      if (subPropertyOf.length > 0) {
        schemaEquivalent+=uiText["Subproperty of:"]+" "+subPropertyOf.join(", ")+"<br>";
      }

      if (skosRelated.length > 0) {
        schemaEquivalent+=uiText["Related (within the context of):"]+" "+skosRelated.join(", ")+"<br>";
      }

      if (seeAlso.length > 0) {
        schemaEquivalent+=uiText["See also:"]+" "+seeAlso.join(", ")+"<br>";
      }

      $("#schemaEquivalent").html(schemaEquivalent);
      if (schemaEquivalent.indexOf('schema:') > -1) {
        $(".termschema").show();
      } else {
        $(".termschema").hide();
      }

      $("#termComment").html(selectLanguage(termComment,uiLanguage));
      var rangeTableContent=tabulateRange(node);
      $("#rangeDetails").html(rangeTableContent);
      $("#rangeShape").html(rangeTableContent);
      if ( (rangeTableContent.indexOf('rdf:langString') > -1) || (rangeTableContent.indexOf('xsd:') > -1) ) {
        $("#rangeShape").attr('class','rect');
      } else {
        $("#rangeShape").attr('class','oval');
      }

      var domainTableContent=tabulateDomain(node);
      $("#domainDetails").html(domainTableContent);
      $("#domainOval").html(domainTableContent);
      $("#predicateArrow").html(term);

      var siblingTableContent=tabulateSiblings(node);
      if (siblingTableContent !== "") {
        $("#siblingDetails").html(siblingTableContent);
        $("#siblinginfo").show();
      } else {
        $("#siblinginfo").hide();
      }

      $('#allClasses').hide();
      $('#allProperties').hide();
      $('#allNamedIndividuals').hide();
      $("#propertiesOfNI").hide();
      $('#allDataTypes').hide();
      $('#allParameters').hide();
      $('#propertiesOfClass').hide();
      $('#propertiesOfParentClass').hide();
      $('#propertiesOfGrandparentClass').hide();
      $('#definedparameters').hide();
      $('#subclasses').hide();
      $('#superclasses').hide();
      $('#havingrangeinfo').hide();
      $('#rangeinfo').show();
      $('#domaininfo').show();
    }

    if (type == "Parameter") {
      $('#triple').hide();
      $('#superclassNote').hide();
      $('#subclassNote').hide();
      $(".termschema").hide();

      var node=getSingleNode(term);
      var datatype=nodeTypes[term];
      var datatypenode = getSingleNode(datatype);
      var datatypeLabel = datatypenode["rdfs:label"];
      var datatypelabeltext = selectLanguage(datatypeLabel,uiLanguage)
      var termLabelen = selectLanguage(termLabel,uiLanguage);
      var termCommentText = selectLanguage(termComment,uiLanguage);
      $("#termComment").html(termCommentText);

      $("#breadcrumbTrail").html('<li><a href="./" class="link">'+ontology_title+'</a></li><li><a href="./?show=datatypes" class="link">Parameters</a></li><li>'+prepareLink(datatype,datatypelabeltext)+'</li><li id="currentClass">'+termLabelen+'</li>');

      $('#allClasses').hide();
      $('#allProperties').hide();
      $('#allNamedIndividuals').hide();
      $("#propertiesOfNI").hide();
      $('#allDataTypes').hide();
      $('#allParameters').hide();
      $('#propertiesOfClass').hide();
      $('#propertiesOfParentClass').hide();
      $('#propertiesOfGrandparentClass').hide();
      $('#definedparameters').hide();
      $('#subclasses').hide();
      $('#superclasses').hide();
      $('#havingrangeinfo').hide();
      $('#siblinginfo').hide();
      $('#rangeinfo').hide();
      $('#domaininfo').hide();
    }
  }
  refreshCatchLinks();
  window.scrollTo(0, 0);
}

function isEmptyObject(obj) {
  // null and undefined are "empty"
  if (obj == null) return true;

  // Assume if it has a length property with a non-zero value
  // that that property is correct.
  if (obj.length > 0)    return false;
  if (obj.length === 0)  return true;

  // If it isn't an object at this point
  // it is empty, but it can't be anything *but* empty
  // Is it empty?  Depends on your application.
  if (typeof obj !== "object") return true;

  for (var key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) return false;
  }

  return true;
}

function show(url) {
  history.pushState(null, null, url);
  updatestate2(url);
}

function refreshCatchLinks() {
  $( ".link" ).each(function( index ) {
    var orig = $( this ).attr('href');
    if (orig !== undefined) {
      if ((! orig.startsWith("javascript:show(") ) && (! orig.startsWith("http://")) ) {
        $( this ).attr('href',"javascript:show('"+orig+"');");
      }
    }
  });
}

function getTerm() {
  var url=window.location.href;
  var ilastslash=url.lastIndexOf("/");
  ilastslash++;
  var term=url.substr(ilastslash);
  return term;
}

function getVersionInfo() {
  $.each(graph, function( index, value ) {
    var type=value["@type"] || [];
    if ((type.indexOf("owl:Ontology") > -1) && value["@id"] == "opp:") {
      if(undefined != value["rdfs:label"]) {
        ontology_title = selectLanguage(value["rdfs:label"],uiLanguage);
      }
      if(undefined != value["owl:versionInfo"]) {
        $("#version-info").html(value["owl:versionInfo"]);
      }
      if (undefined != value["dcterms:issued"] && undefined != value["dcterms:issued"]["@value"]) {
        $("#issued-date").html(value["dcterms:issued"]["@value"]);
      }
    }
    else {
      $("#version-label").addClass('hide');
    }
  });
}

function displayVocabulary(vocab) {
  var json=JSON.parse(vocab);
  graph=json["@graph"];
  context=json["@context"];
  nodeTypes=getNodeTypes();


  //console.log(nodeTypes);
  getVersionInfo();

  $("#classResults").hide();
  $("#propertyResults").hide();
  $("#namedIndividualResults").hide();
  $("#datatypeResults").hide();
  $("#parameterResults").hide();

  // Search.
  $('#doSearch').attr('type','button');
  var searchTermBox = document.getElementById("searchTerm");
  searchTermBox.addEventListener("keydown", function(event) {
    if (event.keyCode == 13) { event.preventDefault(); }
  });
  searchTermBox.addEventListener("keyup", function(event) {
      if (($("#searchTerm").val().length > 2)) {
        doSearch();
        return false;
      }
  });
  searchTermBox.addEventListener("change", function(event) {
      if (($("#searchTerm").val().length > 2)) {
        doSearch();
        return false;
      }
  });
  $('#doSearch').click( function() {
    doSearch();
  });
  $('#view-diagram').click( function( e ) {
    e.preventDefault();
    viewDiagram();
  });

  refreshCatchLinks();

  var term=getTerm();
  updatestate2(term);
  window.onpopstate = function(event){
    var term=getTerm();
    updatestate2(term);
  };
}
