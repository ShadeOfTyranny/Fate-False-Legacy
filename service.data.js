app.service('DataService', ['$rootScope', function($rootScope) {
    const chapterSheetID = '16YZrWXRbsDVW3YBo0mxAhpTWFNXxF9LoXC5Tx1IEyNQ';
    var sheetId = '';
    const updateVal = (100 / 6) + 0.1;
    const boxWidth = 32;
    const gridWidth = 0;
    var progress = 0;

    var characters = null;
    var enemies = null;
    var rows = [];
    var cols = [];
    var map, characterData, classIndex, itemIndex, skillIndex, motifIndex, familiarIndex, coordMapping, terrainLocs;

    this.getCharacters = function() { return characters; };
    this.getMap = function() { return map; };
    this.getRows = function() { return rows; };
    this.getColumns = function() { return cols; };
    this.getTerrainMappings = function() { return terrainLocs; };

    this.loadMapData = function() { fetchCharacterData(); };
    this.calculateRanges = function() { getMapDimensions(); };

    this.FetchSheetID = function(){
        return chapterSheetID;
    };

    this.SetSheetID = function(){
        sheetId = chapterSheetID; 
    };

    //\\//\\//\\//\\//\\//
    // DATA AJAX CALLS  //
    //\\//\\//\\//\\//\\//

    function fetchCharacterData() {
        gapi.client.sheets.spreadsheets.values.get({
            spreadsheetId: sheetId,
            majorDimension: "COLUMNS",
            range: 'Servant Info!B1:ZZ',
        }).then(function(response) {
            characterData = response.result.values;
            updateProgressBar();
			fetchTerrainChart();
        });
    };

    function fetchTerrainChart() {
        gapi.client.sheets.spreadsheets.values.get({
            spreadsheetId: sheetId,
            majorDimension: "ROWS",
            range: 'Terrain Locations!A1:ZZ',
        }).then(function(response) {
            coordMapping = response.result.values;

            updateProgressBar();
            processCharacters();
        });
    };

    function processCharacters() {
        characters = {};

        for (var i = 0; i < characterData.length; i++) {
            var c = characterData[i];
            if (c[0].length == 0) continue;

            var currObj = {
                'name': c[0],
                'spriteUrl' : c[89],
				'affiliation' : c[90],
                'position' : c[7],
                'currHp' : parseInt(c[8]) | 0,
                'maxHp' : parseInt(c[9]) | 0
            };

            characters["char_" + i] = currObj;
        }

        updateProgressBar();
        fetchMapUrl();
    };

    function fetchMapUrl() {
        gapi.client.sheets.spreadsheets.values.get({
            spreadsheetId: sheetId,
            majorDimension: "COLUMNS",
            valueRenderOption: "FORMULA",
            range: 'Map Data!A2:A2',
        }).then(function(response) {
            map = response.result.values[0][0];
            updateProgressBar();
        });
    };

    //******************\\
    // CHARACTER RANGES \\
    //******************\\

    function getMapDimensions() {
        var map = document.getElementById('mapImg');

        var height = map.naturalHeight; //calculate the height of the map
        height = (height / (boxWidth + gridWidth));
        for (var i = 0; i < height; i++)
            rows.push((i+1)+"");

        var width = map.naturalWidth; //calculate the width of the map
        width = (width / (boxWidth + gridWidth));
        for (var i = 0; i < width; i++)
            cols.push((i+1)+"");

        updateProgressBar();
        initializeTerrain();
    };

    function initializeTerrain() {
        terrainLocs = {};

        for (var r = 0; r < rows.length; r++)
            for (var c = 0; c < cols.length; c++)
                terrainLocs[cols[c] + "," + rows[r]] = getDefaultTerrainObj();
        terrainLocs["-1,-1"] = getDefaultTerrainObj();
        terrainLocs["Defeated"] = getDefaultTerrainObj();
        terrainLocs["Not Deployed"] = getDefaultTerrainObj();

        //Update terrain types from input list
        for (var r = 0; r < coordMapping.length; r++) {
            var row = coordMapping[r];
            for (var c = 0; c < cols.length && c < row.length; c++) {
                if (row[c].length > 0) terrainLocs[cols[c] + "," + rows[r]].type = row[c];
            }
        }

        for (var c in characters){
            var char = characters[c];

            if (terrainLocs[characters[c].position] != undefined)
                terrainLocs[characters[c].position].occupiedAffiliation = characters[c].affiliation;
        }

        updateProgressBar();
    };

    function getDefaultTerrainObj() {
        return {
            'type': "Plain",
            'occupiedAffiliation': ''
        }
    };

    //\\//\\//\\//\\//\\//
    // HELPER FUNCTIONS //
    //\\//\\//\\//\\//\\//

    function updateProgressBar() {
        if (progress < 100) {
            progress = progress += updateVal; //6 calls
            $rootScope.$broadcast('loading-bar-updated', progress, map);
        }
    };

    function processImageURL(str) {
        if (str == undefined || str.length == 0) return "";
        else return str.substring(str.indexOf("\"") + 1, str.lastIndexOf("\""));
    };

    //\\//\\//\\//\\//\\//
    //   CALCULATIONS   //
    //\\//\\//\\//\\//\\//

    function calculateTrueStat(char, stat){
        return char[stat];
    };

    function calculateBaseStat(char, stat){
        return char[stat] - char[stat+"Buff"] - char[stat+"Boost"];
    }

}]);
