!function(e){function t(a){if(n[a])return n[a].exports;var i=n[a]={i:a,l:!1,exports:{}};return e[a].call(i.exports,i,i.exports,t),i.l=!0,i.exports}var n={};t.m=e,t.c=n,t.i=function(e){return e},t.d=function(e,n,a){t.o(e,n)||Object.defineProperty(e,n,{configurable:!1,enumerable:!0,get:a})},t.n=function(e){var n=e&&e.__esModule?function(){return e.default}:function(){return e};return t.d(n,"a",n),n},t.o=function(e,t){return Object.prototype.hasOwnProperty.call(e,t)},t.p="",t(t.s=22)}({22:function(e,t){var n,a=this&&this.__extends||function(){var e=Object.setPrototypeOf||{__proto__:[]}instanceof Array&&function(e,t){e.__proto__=t}||function(e,t){for(var n in t)t.hasOwnProperty(n)&&(e[n]=t[n])};return function(t,n){function a(){this.constructor=t}e(t,n),t.prototype=null===n?Object.create(n):(a.prototype=n.prototype,new a)}}();!function(e){"use strict";function t(){var t=this;L=null,w=!1,S=null,E=null,B=null,e.metabolicMapID=-1,e.metabolicMapName=null,e.biomassCalculation=-1,G=[],x=[],e.linesDataGridSpec=null,e.linesDataGrid=null,e.actionPanelIsInBottomBar=!1,v=null,y=null,this.fileUploadProgressBar=new Utl.ProgressBar("fileUploadProgressBar");var n=new FileDropZone.FileDropZoneHelpers({pageRedirect:"",haveInputData:!1});Utl.FileDropZone.create({elementId:"addToLinesDropZone",fileInitFn:n.fileDropped.bind(n),processRawFn:n.fileRead.bind(n),url:"/study/"+EDDData.currentStudyID+"/describe/",processResponseFn:n.fileReturnedFromServer.bind(n),processErrorFn:n.fileErrorReturnedFromServer.bind(n),processWarningFn:n.fileWarningReturnedFromServer.bind(n),progressBar:this.fileUploadProgressBar}),$("#content").on("dragover",function(e){e.stopPropagation(),e.preventDefault(),$(".linesDropZone").removeClass("off")}),$("#content").on("dragend, dragleave, mouseleave",function(e){$(".linesDropZone").addClass("off")}),$("#content").tooltip({content:function(){return $(this).prop("title")},position:{my:"left-10 center",at:"right center"},show:null,close:function(e,t){t.tooltip.hover(function(){$(this).stop(!0).fadeTo(400,1)},function(){$(this).fadeOut("400",function(){$(this).remove()})})}}),$(document).on("click",".disclose .discloseLink",function(e){return $(e.target).closest(".disclose").toggleClass("discloseHide"),!1}),$(window).on("resize",p),$(document).ajaxStop(function(){0===_.keys(EDDData.Assays).length?$("#exportLineButton").prop("disabled",!0):$("#exportLineButton").prop("disabled",!1)}),$.ajax({url:"../edddata/",type:"GET",error:function(e,t,n){$("#overviewSection").prepend("<div class='noData'>Error. Please reload</div>"),console.log(["Loading EDDData failed: ",t,";",n].join(""))},success:function(n){EDDData=$.extend(EDDData||{},n),e.linesDataGridSpec=new o,e.linesDataGridSpec.init(),e.linesDataGrid=new i(t.linesDataGridSpec),0===_.keys(EDDData.Lines).length?$(".noLines").css("display","block"):$(".noLines").css("display","none")}})}function n(){this.carbonBalanceData=new CarbonBalance.Display;var e=!1;this.biomassCalculation>-1?(this.carbonBalanceData.calculateCarbonBalances(this.metabolicMapID,this.biomassCalculation),this.carbonBalanceData.getNumberOfImbalances()>0&&(e=!0)):e=!0,this.linesDataGridSpec.highlightCarbonBalanceWidget(e)}function a(){var t,n,a=this,i=$("#studyLinesTable").parent();n=$(".tableControl").last(),t=$(".move"),i.find(".addNewLineButton").on("click",function(t){return t.preventDefault(),t.stopPropagation(),e.editLines([]),!1}),i.find(".editButton").on("click",function(t){var n=$(t.target),a=n.data();return t.preventDefault(),e.editLines(a.ids||[]),!1}),$(t).insertAfter(n),$("#editLineModal").dialog({minWidth:500,autoOpen:!1}),$("#addAssayModal").dialog({minWidth:500,autoOpen:!1}),$("#exportModal").dialog({minWidth:400,autoOpen:!1,minHeight:0,create:function(){$(this).css("maxHeight",400)}}),i.find(".addAssayButton").click(function(){return $("#addAssayModal").removeClass("off").dialog("open"),!1}),i.find(".exportLineButton").click(function(){$("#exportModal").removeClass("off").dialog("open"),r();var e=$("#studyLinesTable").clone();return $("#exportForm").append(e),e.hide(),!1}),i.find(".worklistButton").click(function(){r();var e=$("#studyLinesTable").clone();$("#exportForm").append(e),e.hide(),$('select[name="export"]').val("worklist"),$('button[value="line_action"]').click()});var o=$(".edd-label").children("input")[1];$(o).on("change",function(){var e=$(o).val(),t=EDDData.MetaDataTypes[e],n=$(".line-meta-value"),a=$(this).parents(".line-edit-meta");a.find(".meta-postfix").remove(),a.find(".meta-prefix").remove(),t&&(t.pre&&$("<span>").addClass("meta-prefix").text(t.pre).insertBefore(n),t.postfix&&$("<span>").addClass("meta-postfix").text(t.postfix).insertAfter(n))}),$("#editLineModal").on("change",".line-meta > :input",function(e){var t=$(e.target).closest("form"),n=t.find("[name=line-meta_store]"),a=JSON.parse(n.val()||"{}");t.find(".line-meta > :input").each(function(e,t){var n=$(t).attr("id").match(/-(\d+)$/)[1];a[n]=$(t).val()}),n.val(JSON.stringify(a))}).on("click",".line-meta-add",function(e){var t,n,a=$(e.target).closest(".line-edit-meta");return t=a.find(".line-meta-type").val(),n=a.find(".line-meta-value").val(),a.find(":input").not(":checkbox, :radio").val(""),a.find(":checkbox, :radio").prop("checked",!1),EDDData.MetaDataTypes[t]&&m(a,t,n).find(":input").trigger("change"),!1}).on("click",".meta-remove",function(e){var t=$(e.target).closest("form"),n=$(e.target).closest(".line-meta"),a=t.find("[name=line-meta_store]"),i=JSON.parse(a.val()||"{}");i[n.attr("id").match(/-(\d+)$/)[1]]=null,a.val(JSON.stringify(i)),n.remove()}),p(),$.each(EDDData.Protocols,function(e,t){$.ajax({url:"/study/"+EDDData.currentStudyID+"/measurements/"+e+"/",type:"GET",dataType:"json",error:function(e,n){console.log("Failed to fetch measurement data on "+t.name+"!"),console.log(n)},success:s.bind(a,t)})})}function r(){if(0===$("#studyLinesTable").find("input[name=lineId]:checked").length){var e=_.keys(EDDData.Studies)[0];$("<input>").attr({type:"hidden",value:e,name:"studyId"}).appendTo("form")}}function s(e,t){var n={},a={},i=0,r=0;EDDData.AssayMeasurements=EDDData.AssayMeasurements||{},EDDData.MeasurementTypes=$.extend(EDDData.MeasurementTypes||{},t.types),$.each(t.total_measures,function(e,t){var n=EDDData.Assays[e];n&&(n.count=t,i+=t)}),$.each(t.measures||{},function(e,i){var o,s,l=EDDData.Assays[i.assay];++r,l&&l.active&&void 0!==l.count&&(o=EDDData.Lines[l.lid])&&o.active&&($.extend(i,{values:t.data[i.id]||[]}),EDDData.AssayMeasurements[i.id]=i,n[l.id]=!0,a[l.pid]=a[l.pid]||{},a[l.pid][l.id]=!0,s=t.types[i.type]||{},(l.measures=l.measures||[]).push(i.id),"m"===s.family?(l.metabolites=l.metabolites||[]).push(i.id):"p"===s.family?(l.proteins=l.proteins||[]).push(i.id):"g"===s.family?(l.transcriptions=l.transcriptions||[]).push(i.id):(l.general=l.general||[]).push(i.id))}),p(),this.linesDataGridSpec.enableCarbonBalanceWidget(!0),this.processCarbonBalanceData()}function l(e,t){g()}function c(){this.linesActionPanelRefreshTimer&&clearTimeout(this.linesActionPanelRefreshTimer),this.linesActionPanelRefreshTimer=setTimeout(d.bind(this),150)}function d(){var e,t=[];this.linesDataGrid&&(t=this.linesDataGrid.getSelectedCheckboxElements()),0===_.keys(EDDData.Lines).length?($(".lineExplanation").css("display","block"),$(".actionsBar").addClass("off")):(e=t.length,$(".linesSelectedCell").empty().text(e+" selected"),$(".editButton").data({count:e,ids:t.map(function(e){return e.value})}),e?($(".disablableButtons > button").prop("disabled",!1),e<2&&$(".groupButton").prop("disabled",!0)):$(".disablableButtons > button").prop("disabled",!0))}function p(){y&&clearTimeout(y),y=setTimeout(e.positionActionsBar.bind(this),50)}function u(){var t,n,a,i;e.actionPanelIsCopied||(t=$("#actionsBar"),n=t.clone().appendTo("#bottomBar").hide(),n.on("click","button",function(e){t.find("#"+e.target.id).trigger(e)}),e.actionPanelIsCopied=!0),a=$("#content").height(),i=0,$("#content").children().each(function(e,t){i+=t.scrollHeight}),e.actionPanelIsInBottomBar&&i<a?($(".actionsBar").toggle(),e.actionPanelIsInBottomBar=!1):!e.actionPanelIsInBottomBar&&a<i&&($(".actionsBar").toggle(),e.actionPanelIsInBottomBar=!0)}function h(){var e=$("#editLineModal");return e.find(".line-meta").remove(),e.find("[name^=line-]").not(":checkbox, :radio").val(""),e.find("[name^=line-]").filter(":checkbox, :radio").prop("checked",!1),e.find(".errorlist").remove(),e.find(".cancel-link").remove(),e.find(".bulk").addClass("off"),e.off("change.bulk"),e}function D(e){var t,n,a,i=$("#editLineModal");n=EDDData.Users[e.experimenter],a=EDDData.Users[e.contact.user_id],i.find("[name=line-name]").val(e.name),i.find("[name=line-description]").val(e.description),i.find("[name=line-control]").prop("checked",e.control),i.find("[name=line-contact_0]").val(e.contact.text||(a&&a.uid?a.uid:"--")),i.find("[name=line-contact_1]").val(e.contact.user_id),i.find("[name=line-experimenter_0]").val(n&&n.uid?n.uid:"--"),i.find("[name=line-experimenter_1]").val(e.experimenter),i.find("[name=line-carbon_source_0]").val(e.carbon.map(function(e){return(EDDData.CSources[e]||{}).name||"--"}).join(",")),i.find("[name=line-carbon_source_1]").val(e.carbon.join(",")),i.find("[name=line-strains_0]").val(e.strain.map(function(e){return(EDDData.Strains[e]||{}).name||"--"}).join(",")),i.find("[name=line-strains_1]").val(e.strain.map(function(e){return(EDDData.Strains[e]||{}).registry_id||""}).join(",")),e.strain.length&&""===i.find("[name=line-strains_1]").val()&&$("<li>").text("Strain does not have a linked ICE entry! Saving the line without linking to ICE will remove the strain.").wrap("<ul>").parent().addClass("errorlist").appendTo(i.find("[name=line-strains_0]").parent()),t=i.find(".line-edit-meta"),$.each(e.meta,function(e,n){m(t,e,n)}),i.find("[name=line-meta_store]").val(JSON.stringify(e.meta)),i.find("[name=initial-line-meta_store]").val(JSON.stringify(e.meta))}function m(e,t,n){var a,i,r,o,s,l="line-meta-"+t;return a=$("<p>").attr("id","row_"+l).addClass("line-meta").insertBefore(e),i=EDDData.MetaDataTypes[t],r=$("<label>").attr("for","id_"+l).text(i.name).appendTo(a),$('<input type="text">').attr("id","id_"+l).addClass("form-control").val(n).appendTo(a),o=$(e).find(".meta-postfix"),s=$(e).find(".meta-prefix"),o.remove(),s.remove(),i.pre&&$("<span>").addClass("meta-prefix").text("("+i.pre+") ").insertBefore(r),$("<span>").addClass("meta-remove").text("Remove").insertAfter(r),i.postfix&&$("<span>").addClass("meta-postfix").text(" ("+i.postfix+")").insertAfter(r),a}function f(e){var t,n=$("#editLineModal"),a={};h();var i="Add New Line";e.length>0&&(i="Edit Line"+(e.length>1?"s ("+e.length+")":"")),$("#editLineModal").dialog({minWidth:500,autoOpen:!1,title:i}),e.length>1?($("#id_line-name").parent().hide(),$(".bulkNoteGroup").removeClass("off"),n.on("change.bulk",":input",function(e){$(e.target).siblings("label").find(".bulk").prop("checked",!0)})):($(".bulkNoteGroup").addClass("off"),$("#id_line-name").parent().show()),1===e.length?($(".bulkNoteGroup").addClass("off"),D(EDDData.Lines[e[0]]),$("#id_line-name").parent().show()):(e.map(function(e){return EDDData.Lines[e]||{}}).forEach(function(e){$.extend(a,e.meta||{})}),t=n.find(".line-edit-meta"),$.each(a,function(e){return m(t,e,"")})),n.find("[name=line-ids]").val(e.join(",")),n.removeClass("off").dialog("open")}function b(){this.metabolicMapName?$("#metabolicMapName").html(this.metabolicMapName):$("#metabolicMapName").html("(none)"),this.biomassCalculation&&-1!=this.biomassCalculation&&(this.carbonBalanceData.calculateCarbonBalances(this.metabolicMapID,this.biomassCalculation),this.carbonBalanceDisplayIsFresh=!1,this.rebuildCarbonBalanceGraphs())}function g(){var e,t=this,n=this.linesDataGridSpec.carbonBalanceCol;this.carbonBalanceDisplayIsFresh||(this.carbonBalanceData.removeAllCBGraphs(),e=[],n.memberColumns.forEach(function(t){Array.prototype.push.apply(e,t.getEntireIndex())}),e.forEach(function(e){t.carbonBalanceData.createCBGraphForLine(e.recordID,e.cellElement)}),this.carbonBalanceDiplayIsFresh=!0)}function C(){var e=this,t=function(t,n,a,i){t?console.log("onClickedMetabolicMapName error: "+t):(e.metabolicMapID=n,e.metabolicMapName=a,e.biomassCalculation=i,e.onChangedMetabolicMap())};new StudyMetabolicMapChooser(!1,t)}var v,y,S,E,B,L,w,G,x;e.actionPanelIsCopied=!1,e.prepareIt=t,e.processCarbonBalanceData=n,e.prepareAfterLinesTable=a,e.carbonBalanceColumnRevealedCallback=l,e.queueLinesActionPanelShow=c,e.queuePositionActionsBar=p,e.positionActionsBar=u,e.editLines=f,e.onChangedMetabolicMap=b,e.rebuildCarbonBalanceGraphs=g,e.onClickedMetabolicMapName=C}(n||(n={}));var i=function(e){function t(t){return e.call(this,t)||this}return a(t,e),t.prototype._getClasses=function(){return"dataTable sortable dragboxes hastablecontrols table-striped"},t}(DataGrid),r=function(e){function t(){return null!==e&&e.apply(this,arguments)||this}return a(t,e),t.prototype.clickHandler=function(){e.prototype.clickHandler.call(this);var t=$("#studyLinesTable").find("tbody input[type=checkbox]:checked").length;$(".linesSelectedCell").empty().text(t+" selected"),n.queueLinesActionPanelShow()},t}(DGSelectAllWidget),o=function(e){function t(){return null!==e&&e.apply(this,arguments)||this}return a(t,e),t.prototype.init=function(){this.findMetaDataIDsUsedInLines(),this.findGroupIDsAndNames(),e.prototype.init.call(this)},t.prototype.highlightCarbonBalanceWidget=function(e){this.carbonBalanceWidget.highlight(e)},t.prototype.enableCarbonBalanceWidget=function(e){this.carbonBalanceWidget.enable(e)},t.prototype.findMetaDataIDsUsedInLines=function(){var e={};$.each(this.getRecordIDs(),function(t,n){var a=EDDData.Lines[n];a&&$.each(a.meta||{},function(t){return e[t]=!0})}),this.metaDataIDsUsedInLines=Object.keys(e)},t.prototype.findGroupIDsAndNames=function(){var e=this,t={};$.each(this.getRecordIDs(),function(e,n){var a=EDDData.Lines[n],i=a.replicate;i&&(t[i]=t[i]||[i]).push(n)}),this.groupIDsToGroupNames={},$.each(t,function(t,n){void 0===EDDData.Lines[t]||void 0===EDDData.Lines[t].name?e.groupIDsToGroupNames[t]=null:e.groupIDsToGroupNames[t]=EDDData.Lines[t].name}),this.groupIDsInOrder=Object.keys(t).sort(function(t,n){var a=e.groupIDsToGroupNames[t],i=e.groupIDsToGroupNames[n];return a<i?-1:a>i?1:0}),this.groupIDsToGroupIndexes={},$.each(this.groupIDsInOrder,function(t,n){return e.groupIDsToGroupIndexes[n]=t})},t.prototype.defineTableSpec=function(){return new DataGridTableSpec("lines",{name:"Lines"})},t.prototype.loadLineName=function(e){var t;return(t=EDDData.Lines[e])?t.name.toUpperCase():""},t.prototype.loadLineDescription=function(e){var t;return(t=EDDData.Lines[e])&&null!=t.description?t.description.toUpperCase():""},t.prototype.loadStrainName=function(e){var t,n;return(t=EDDData.Lines[e])&&t.strain&&t.strain.length&&(n=EDDData.Strains[t.strain[0]])?n.name.toUpperCase():"?"},t.prototype.loadFirstCarbonSource=function(e){var t,n;if((t=EDDData.Lines[e])&&t.carbon&&t.carbon.length&&(n=EDDData.CSources[t.carbon[0]]))return n},t.prototype.loadCarbonSource=function(e){var t=this.loadFirstCarbonSource(e);return t?t.name.toUpperCase():"?"},t.prototype.loadCarbonSourceLabeling=function(e){var t=this.loadFirstCarbonSource(e);return t?t.labeling.toUpperCase():"?"},t.prototype.loadExperimenterInitials=function(e){var t,n;return(t=EDDData.Lines[e])&&(n=EDDData.Users[t.experimenter])?n.initials.toUpperCase():"?"},t.prototype.loadLineModification=function(e){var t;if(t=EDDData.Lines[e])return t.modified.time},t.prototype.defineHeaderSpec=function(){var e=this,t=[new DataGridHeaderSpec(1,"hLinesName",{name:"Name",sortBy:this.loadLineName}),new DataGridHeaderSpec(2,"hLinesDescription",{name:"Description",sortBy:this.loadLineDescription,sortAfter:0}),new DataGridHeaderSpec(3,"hLinesStrain",{name:"Strain",sortBy:this.loadStrainName,sortAfter:0}),new DataGridHeaderSpec(4,"hLinesCarbon",{name:"Carbon Source(s)",size:"s",sortBy:this.loadCarbonSource,sortAfter:0}),new DataGridHeaderSpec(5,"hLinesLabeling",{name:"Labeling",size:"s",sortBy:this.loadCarbonSourceLabeling,sortAfter:0}),new DataGridHeaderSpec(6,"hLinesCarbonBalance",{name:"Carbon Balance",size:"s",sortBy:this.loadLineName})],n=this.metaDataIDsUsedInLines.map(function(t,n){var a=EDDData.MetaDataTypes[t];return new DataGridHeaderSpec(7+n,"hLinesMeta"+t,{name:a.name,size:"s",sortBy:e.makeMetaDataSortFunction(t),sortAfter:0})}),a=[new DataGridHeaderSpec(7+n.length,"hLinesExperimenter",{name:"Experimenter",size:"s",sortBy:this.loadExperimenterInitials,sortAfter:0}),new DataGridHeaderSpec(8+n.length,"hLinesModified",{name:"Last Modified",size:"s",sortBy:this.loadLineModification,sortAfter:0})];return t.concat(n,a)},t.prototype.makeMetaDataSortFunction=function(e){return function(t){var n=EDDData.Lines[t];return n&&n.meta?n.meta[e]||"":""}},t.prototype.rowSpanForRecord=function(e){return(EDDData.Lines[e].carbon||[]).length||1},t.prototype.generateLineNameCells=function(e,t){var n=EDDData.Lines[t];return[new DataGridDataCell(e,t,{checkboxName:"lineId",checkboxWithID:function(e){return"line"+e+"include"},sideMenuItems:['<a href="#" class="line-edit-link" onclick="StudyLines.editLines(['+t+'])">Edit Line</a>','<a href="/export?lineId='+t+'">Export Data as CSV/Excel</a>','<a href="/sbml?lineId='+t+'">Export Data as SBML</a>'],hoverEffect:!0,nowrap:!0,rowspan:e.rowSpanForRecord(t),contentString:n.name+(n.ctrl?'<b class="iscontroldata">C</b>':"")})]},t.prototype.generateStrainNameCells=function(e,t){var n,a=[];return(n=EDDData.Lines[t])&&(a=n.strain.map(function(e){var t=EDDData.Strains[e];return['<a href="',t.registry_url,'">',t.name,"</a>"].join("")})),[new DataGridDataCell(e,t,{rowspan:e.rowSpanForRecord(t),contentString:a.join("; ")||"--"})]},t.prototype.generateDescriptionCells=function(e,t){var n,a="--";return(n=EDDData.Lines[t])&&n.description&&n.description.length&&(a=n.description),[new DataGridDataCell(e,t,{rowspan:e.rowSpanForRecord(t),contentString:a})]},t.prototype.generateCarbonSourceCells=function(e,t){var n,a=["--"];return(n=EDDData.Lines[t])&&n.carbon&&n.carbon.length&&(a=n.carbon.map(function(e){return EDDData.CSources[e].name})),a.map(function(n){return new DataGridDataCell(e,t,{contentString:n})})},t.prototype.generateCarbonSourceLabelingCells=function(e,t){var n,a=["--"];return(n=EDDData.Lines[t])&&n.carbon&&n.carbon.length&&(a=n.carbon.map(function(e){return EDDData.CSources[e].labeling})),a.map(function(n){return new DataGridDataCell(e,t,{contentString:n})})},t.prototype.generateCarbonBalanceBlankCells=function(e,t){return[new DataGridDataCell(e,t,{rowspan:e.rowSpanForRecord(t),minWidth:200})]},t.prototype.generateExperimenterInitialsCells=function(e,t){var n,a,i;return(n=EDDData.Lines[t])&&EDDData.Users&&(a=EDDData.Users[n.experimenter])&&(i=a.initials),[new DataGridDataCell(e,t,{rowspan:e.rowSpanForRecord(t),contentString:i||"?"})]},t.prototype.generateModificationDateCells=function(e,t){return[new DataGridDataCell(e,t,{rowspan:e.rowSpanForRecord(t),contentString:Utl.JS.timestampToTodayString(EDDData.Lines[t].modified.time)})]},t.prototype.makeMetaDataCellsGeneratorFunction=function(e){return function(t,n){var a="",i=EDDData.Lines[n],r=EDDData.MetaDataTypes[e];return i&&r&&i.meta&&(a=i.meta[e]||"")&&(a=[r.pre||"",a,r.postfix||""].join(" ").trim()),[new DataGridDataCell(t,n,{rowspan:t.rowSpanForRecord(n),contentString:a})]}},t.prototype.defineColumnSpec=function(){var e,t,n,a=this;return e=[new DataGridColumnSpec(1,this.generateLineNameCells),new DataGridColumnSpec(2,this.generateDescriptionCells),new DataGridColumnSpec(3,this.generateStrainNameCells),new DataGridColumnSpec(4,this.generateCarbonSourceCells),new DataGridColumnSpec(5,this.generateCarbonSourceLabelingCells),new DataGridColumnSpec(6,this.generateCarbonBalanceBlankCells)],t=this.metaDataIDsUsedInLines.map(function(e,t){return new DataGridColumnSpec(7+t,a.makeMetaDataCellsGeneratorFunction(e))}),n=[new DataGridColumnSpec(7+t.length,this.generateExperimenterInitialsCells),new DataGridColumnSpec(8+t.length,this.generateModificationDateCells)],e.concat(t,n)},t.prototype.defineColumnGroupSpec=function(){var e,t=[new DataGridColumnGroupSpec("Line Name",{showInVisibilityList:!1}),new DataGridColumnGroupSpec("Description"),new DataGridColumnGroupSpec("Strain"),new DataGridColumnGroupSpec("Carbon Source(s)"),new DataGridColumnGroupSpec("Labeling"),this.carbonBalanceCol=new DataGridColumnGroupSpec("Carbon Balance",{showInVisibilityList:!1,hiddenByDefault:!0,revealedCallback:n.carbonBalanceColumnRevealedCallback})];e=this.metaDataIDsUsedInLines.map(function(e,t){var n=EDDData.MetaDataTypes[e];return new DataGridColumnGroupSpec(n.name)});var a=[new DataGridColumnGroupSpec("Experimenter",{hiddenByDefault:!0}),new DataGridColumnGroupSpec("Last Modified",{hiddenByDefault:!0})];return t.concat(e,a)},t.prototype.defineRowGroupSpec=function(){for(var e=[],t=0;t<this.groupIDsInOrder.length;t++){var n=this.groupIDsInOrder[t],a={name:this.groupIDsToGroupNames[n]};e.push(a)}return e},t.prototype.getTableElement=function(){return document.getElementById("studyLinesTable")},t.prototype.getRecordIDs=function(){return Object.keys(EDDData.Lines)},t.prototype.createCustomHeaderWidgets=function(e){var t=[],n=new c(e,this,"Search Lines",30,!1);t.push(n);var a=new d(e,this);a.displayBeforeViewMenu(!0),t.push(a),this.carbonBalanceWidget=a;var i=new r(e,this);return i.displayBeforeViewMenu(!0),t.push(i),t},t.prototype.createCustomOptionsWidgets=function(e){var t=[],n=new l(e,this);t.push(n);var a=new s(e,this);return t.push(a),t},t.prototype.onInitialized=function(e){var t=this.getTableElement();$(t).on("change",":checkbox",function(){return n.queueLinesActionPanelShow()}),this.enableCarbonBalanceWidget(!1),n.prepareAfterLinesTable()},t}(DataGridSpecBase),s=function(e){function t(){return null!==e&&e.apply(this,arguments)||this}return a(t,e),t.prototype.createElements=function(e){var t=this,n=this.dataGridSpec.tableSpec.id+"ShowDLinesCB"+e,a=this._createCheckbox(n,n,"1");$(a).click(function(e){return t.dataGridOwnerObject.clickedOptionWidget(e)}),this.isEnabledByDefault()&&a.setAttribute("checked","checked"),this.checkBoxElement=a,this.labelElement=this._createLabel("Show Disabled",n),this._createdElements=!0},t.prototype.applyFilterToIDs=function(e){var t=!1;if(this.checkBoxElement.checked&&(t=!0),t&&e&&EDDData.currentStudyWritable)return $(".enableButton").removeClass("off"),e;$(".enableButton").addClass("off");for(var n=[],a=0;a<e.length;a++){var i=e[a];EDDData.Lines[i].active&&n.push(i)}return n},t.prototype.initialFormatRowElementsForID=function(e,t){EDDData.Lines[t].active||$.each(e,function(e,t){return $(t.getElement()).addClass("disabledRecord")})},t}(DataGridOptionWidget),l=function(e){function t(){return null!==e&&e.apply(this,arguments)||this}return a(t,e),t.prototype.createElements=function(e){var t=this,n="GroupStudyReplicatesCB",a=this._createCheckbox(n,n,"1");$(a).click(function(e){t.checkBoxElement.checked?t.dataGridOwnerObject.turnOnRowGrouping():t.dataGridOwnerObject.turnOffRowGrouping()}),this.isEnabledByDefault()&&a.setAttribute("checked","checked"),this.checkBoxElement=a,this.labelElement=this._createLabel("Group Replicates",n),this._createdElements=!0},t}(DataGridOptionWidget),c=function(e){function t(t,n,a,i,r){return e.call(this,t,n,a,i,r)||this}return a(t,e),t.prototype.createElements=function(t){e.prototype.createElements.call(this,t),this.createdElements(!0)},t.prototype.appendElements=function(e,t){this.createdElements()||this.createElements(t),e.appendChild(this.element)},t}(DGSearchWidget),d=function(e){function t(t,n){var a=e.call(this,t,n)||this;return a.checkboxEnabled=!0,a.highlighted=!1,a._lineSpec=n,a}return a(t,e),t.prototype.createElements=function(e){var t=this,n=this.dataGridSpec.tableSpec.id+"CarBal"+e,a=this._createCheckbox(n,n,"1");a.className="tableControl",$(a).click(function(e){t.activateCarbonBalance()});var i=this._createLabel("Carbon Balance",n),r=document.createElement("span");r.className="tableControl",r.appendChild(a),r.appendChild(i),this.checkBoxElement=a,this.labelElement=i,this.element=r,this.createdElements(!0)},t.prototype.highlight=function(e){this.highlighted=e,this.checkboxEnabled&&(this.labelElement.style.color=e?"red":"")},t.prototype.enable=function(e){this.checkboxEnabled=e,e?(this.highlight(this.highlighted),this.checkBoxElement.removeAttribute("disabled")):(this.labelElement.style.color="gray",this.checkBoxElement.setAttribute("disabled",!0))},t.prototype.activateCarbonBalance=function(){var e,t=this;e=function(e,a,i,r){e||(n.metabolicMapID=a,n.metabolicMapName=i,n.biomassCalculation=r,n.onChangedMetabolicMap(),t.checkBoxElement.checked=!0,t.dataGridOwnerObject.showColumn(t._lineSpec.carbonBalanceCol))},this.checkBoxElement.checked?n.biomassCalculation&&-1!==n.biomassCalculation?this.dataGridOwnerObject.showColumn(this._lineSpec.carbonBalanceCol):(this.checkBoxElement.checked=!1,new FullStudyBiomassUI(e)):this.dataGridOwnerObject.hideColumn(this._lineSpec.carbonBalanceCol)},t}(DataGridHeaderWidget);$(function(){return n.prepareIt()})}});
//# sourceMappingURL=StudyLines.js.map