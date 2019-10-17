console.info('Loaded Internet Gateway Javascript');

/*
** Set Valid drop Targets
 */
asset_drop_targets[internet_gateway_artifact] = [virtual_cloud_network_artifact];
asset_connect_targets[internet_gateway_artifact] = [];
asset_add_functions[internet_gateway_artifact] = "addInternetGateway";
asset_delete_functions[internet_gateway_artifact] = "deleteInternetGateway";
asset_clear_functions.push("clearInternetGatewayVariables");

const internet_gateway_stroke_colour = "purple";
const internet_gateway_query_cb = "internet-gateway-query-cb";
let internet_gateway_ids = [];
let internet_gateway_count = 0;

/*
** Reset variables
 */

function clearInternetGatewayVariables() {
    internet_gateway_ids = [];
    internet_gateway_count = 0;
}

/*
** Add Asset to JSON Model
 */
function addInternetGateway(vcn_id, compartment_id) {
    let id = 'okit-' + internet_gateway_prefix + '-' + uuidv4();
    console.groupCollapsed('Adding ' + internet_gateway_artifact + ' : ' + id);

    // Add Virtual Cloud Network to JSON

    if (!okitJson.hasOwnProperty('internet_gateways')) {
        okitJson['internet_gateways'] = [];
    }

    // Add id & empty name to id JSON
    okitIdsJsonObj[id] = '';
    internet_gateway_ids.push(id);

    // Increment Count
    internet_gateway_count += 1;
    let internet_gateway = {};
    internet_gateway['vcn_id'] = vcn_id;
    internet_gateway['virtual_cloud_network'] = '';
    internet_gateway['compartment_id'] = compartment_id;
    internet_gateway['id'] = id;
    internet_gateway['display_name'] = generateDefaultName(internet_gateway_prefix, internet_gateway_count);
    okitJson['internet_gateways'].push(internet_gateway);
    okitIdsJsonObj[id] = internet_gateway['display_name'];
    //console.info(JSON.stringify(okitJson, null, 2));
    //drawInternetGatewaySVG(internet_gateway);
    drawSVGforJson();
    loadInternetGatewayProperties(id);
    console.groupEnd();
}

/*
** Delete From JSON Model
 */

function deleteInternetGateway(id) {
    console.groupCollapsed('Delete ' + internet_gateway_artifact + ' : ' + id);
    // Remove SVG Element
    d3.select("#" + id + "-svg").remove()
    // Remove Data Entry
    for (let i=0; i < okitJson['internet_gateways'].length; i++) {
        if (okitJson['internet_gateways'][i]['id'] == id) {
            okitJson['internet_gateways'].splice(i, 1);
        }
    }
    // Remove Subnet references
    if ('route_tables' in okitJson) {
        for (route_table of okitJson['route_tables']) {
            for (let i = 0; i < route_table['route_rules'].length; i++) {
                if (route_table['route_rules'][i]['network_entity_id'] == id) {
                    route_table['route_rules'].splice(i, 1);
                }
            }
        }
    }
    console.groupEnd();
}

/*
** SVG Creation
 */
function getInternetGatewayDimensions(id='') {
    return {width:icon_width, height:icon_height};
}

function newInternetGatewayDefinition(artifact, position=0) {
    let dimensions = getInternetGatewayDimensions();
    let definition = newArtifactSVGDefinition(artifact, internet_gateway_artifact);
    definition['svg']['x'] = Math.round(icon_width * 2 + (icon_width * position) + (icon_spacing * position));
    definition['svg']['y'] = 0;
    definition['svg']['width'] = dimensions['width'];
    definition['svg']['height'] = dimensions['height'];
    definition['rect']['stroke']['colour'] = internet_gateway_stroke_colour;
    definition['rect']['stroke']['dash'] = 1;
    return definition;
}

function drawInternetGatewaySVG(artifact) {
    let parent_id = artifact['vcn_id'];
    artifact['parent_id'] = parent_id;
    let id = artifact['id'];
    let compartment_id = artifact['compartment_id'];
    console.groupCollapsed('Drawing ' + internet_gateway_artifact + ' : ' + id + ' [' + parent_id + ']');

    if (!virtual_cloud_network_bui_sub_artifacts.hasOwnProperty(parent_id)) {
        virtual_cloud_network_bui_sub_artifacts[parent_id] = {};
    }

    if (virtual_cloud_network_bui_sub_artifacts.hasOwnProperty(parent_id)) {
        if (!virtual_cloud_network_bui_sub_artifacts[parent_id].hasOwnProperty('gateway_position')) {
            virtual_cloud_network_bui_sub_artifacts[parent_id]['gateway_position'] = 0;
        }
        // Calculate Position
        let position = virtual_cloud_network_bui_sub_artifacts[parent_id]['gateway_position'];
        // Increment Icon Position
        virtual_cloud_network_bui_sub_artifacts[parent_id]['gateway_position'] += 1;

        let svg = drawArtifact(newInternetGatewayDefinition(artifact, position));

        //loadInternetGatewayProperties(id);
        // Add click event to display properties
        // Add Drag Event to allow connector (Currently done a mouse events because SVG does not have drag version)
        // Add dragevent versions
        // Set common attributes on svg element and children
        svg.on("click", function () {
            loadInternetGatewayProperties(id);
            d3.event.stopPropagation();
        });
        //    .on("contextmenu", handleContextMenu);
    } else {
        console.info(parent_id + ' was not found in virtual cloud network sub artifacts : ' + JSON.stringify(virtual_cloud_network_bui_sub_artifacts));
    }
    console.groupEnd();
}

/*
** Property Sheet Load function
 */
function loadInternetGatewayProperties(id) {
    $("#properties").load("propertysheets/internet_gateway.html", function () {
        if ('internet_gateways' in okitJson) {
            console.info('Loading Internet Gateway: ' + id);
            let json = okitJson['internet_gateways'];
            for (let i = 0; i < json.length; i++) {
                let internet_gateway = json[i];
                //console.info(JSON.stringify(internet_gateway, null, 2));
                if (internet_gateway['id'] == id) {
                    //console.info('Found Internet Gateway: ' + id);
                    internet_gateway['virtual_cloud_network'] = okitIdsJsonObj[internet_gateway['vcn_id']];
                    $("#virtual_cloud_network").html(internet_gateway['virtual_cloud_network']);
                    $('#display_name').val(internet_gateway['display_name']);
                    // Add Event Listeners
                    addPropertiesEventListeners(internet_gateway, []);
                    break;
                }
            }
        }
    });
}

/*
** Query OCI
 */

function queryInternetGatewayAjax(compartment_id, vcn_id) {
    console.info('------------- queryInternetGatewayAjax --------------------');
    let request_json = {};
    request_json['compartment_id'] = compartment_id;
    request_json['vcn_id'] = vcn_id;
    if ('internet_gateway_filter' in okitQueryRequestJson) {
        request_json['internet_gateway_filter'] = okitQueryRequestJson['internet_gateway_filter'];
    }
    $.ajax({
        type: 'get',
        url: 'oci/artifacts/InternetGateway',
        dataType: 'text',
        contentType: 'application/json',
        data: JSON.stringify(request_json),
        success: function(resp) {
            let response_json = JSON.parse(resp);
            okitJson['internet_gateways'] = response_json;
            let len =  response_json.length;
            for(let i=0;i<len;i++ ){
                console.info('queryInternetGatewayAjax : ' + response_json[i]['display_name']);
            }
            redrawSVGCanvas();
            $('#' + internet_gateway_query_cb).prop('checked', true);
            hideQueryProgressIfComplete();
        },
        error: function(xhr, status, error) {
            console.info('Status : '+ status)
            console.info('Error : '+ error)
        }
    });
}

$(document).ready(function() {
    clearInternetGatewayVariables();

    // Setup Search Checkbox
    let body = d3.select('#query-progress-tbody');
    let row = body.append('tr');
    let cell = row.append('td');
    cell.append('input')
        .attr('type', 'checkbox')
        .attr('id', internet_gateway_query_cb);
    cell.append('label').text(internet_gateway_artifact);

    // Setup Query Display Form
    body = d3.select('#query-oci-tbody');
    row = body.append('tr');
    cell = row.append('td')
        .text(internet_gateway_artifact);
    cell = row.append('td');
    let input = cell.append('input')
        .attr('type', 'text')
        .attr('class', 'query-filter')
        .attr('id', 'internet_gateway_name_filter')
        .attr('name', 'internet_gateway_name_filter');
});

