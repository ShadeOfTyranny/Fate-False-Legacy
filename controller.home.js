app.controller('HomeCtrl', ['$scope', '$location', '$interval', 'DataService', 'MusicService', function ($scope, $location, $interval, DataService, MusicService) {
	$scope.rows = ["1"];
	$scope.columns = ["1"];
	const boxWidth = 32;
	const gridWidth = 0;
	var numDefeat = 0;
	$scope.showGrid = 2;
	var refreshListener;
	var supportBonuses;

	$scope.battleStatsList = [
	                ["Atk", "130px", "5px"],
	                ["Hit", "130px", "95px"],
	                ["Crit", "157px", "5px"],
	                ["Avo", "157px", "95px"]
	               ];
	$scope.statsList = [
	                ["Str", "Strength. Affects damage the unit deals with physical attacks.",    "5px"],
	                ["Mag", "Magic. Affects damage the unit deals with magical attacks.",        "35px"],
	                ["Skl", "Skill. Affects hit rate and the frequency of critical hits.",       "65px"],
	                ["Spd", "Speed. Affects Avo. Unit strikes twice if 5 higher than opponent.", "95px"],
	                ["Def", "Defense. Reduces damage from physical attacks.",                    "125px"],
	                ["Res", "Resistance. Reduces damage from physical attacks.",                 "155px"]
	               ];
	
	//Interval timers
    var dragNDrop = $interval(initializeListeners, 250, 20);
	
	//Music functions
	$scope.toggleMusic = function(){ MusicService.toggleMusic(); };
	$scope.musicPlaying = function(){ return MusicService.musicPlaying(); };
	$scope.setTrack = function(n){ MusicService.setTrack($scope.selectedTrack); };
	$scope.musicTracks = MusicService.getTrackList();
	$scope.selectedTrack = $scope.musicTracks[0];
    
    //Positioning constants
    const weaponVerticalPos = ["59px", "86px", "113px", "140px", "167px"];
	const weaponRankHorzPos = ["130px", "185px"];
    const weaponDescVerticalPos = ["35px", "50px", "65px", "80px", "95px"];
    const skillVerticalPos = ["5px", "32px", "59px", "86px", "113px", "140px", "167px"];
    const skillDescVerticalPos = ["5px", "20px", "35px", "50px", "65px", "80px", "95px"];
    
    //Constants
    const STAT_DEFAULT_COLOR = "#000000";
    const STAT_BUFF_COLOR = "#353cff";
	const STAT_DEBUFF_COLOR = "#ff0000";
	
	const NAMETAG_BLUE = "#255bb2";
	const NAMETAG_RED = "#c00c13";
	const NAMETAG_GREEN = "#33bb33";
	const NAMETAG_GREEN2 = "#9ef237";
	const NAMETAG_PERIWINKLE = "#9988dd";

	const STATUS_POSITIVE = "#0084ff";
	const STATUS_NEGATIVE = "#ff0000";
	const STATUS_NEUTRAL = "#9aeaa5";
	const STATUS_NONE = "#ffffff";
    
    //Reroutes the user if they haven't logged into the app
    //Loads data from the DataService if they have
	if(DataService.getCharacters() == null)
		$location.path('/');
	else{
		$scope.charaData = DataService.getCharacters();
		$scope.mapUrl = DataService.getMap();
		$scope.rows = DataService.getRows();
		$scope.columns = DataService.getColumns();
		$scope.terrainTypes = DataService.getTerrainTypes();
		$scope.terrainLocs = DataService.getTerrainMappings();
	}

	$scope.redirectToHomePage = function() {
		$location.path('/');
  	};

	$scope.refreshData = function(){
		if($scope.refreshing == true) return; //If already refreshing, don't make a second call
		$scope.refreshing = true;
		
		refreshListener = $scope.$on('loading-bar-updated', function(event, data) {
			if(data >= 100){
				refreshListener(); //cancel listener
				$scope.refreshing = false;
				$scope.charaData = DataService.getCharacters();
				$scope.mapUrl = DataService.getMap();
				$scope.rows = DataService.getRows();
				$scope.columns = DataService.getColumns();
				$scope.terrainTypes = DataService.getTerrainTypes();
				$scope.terrainLocs = DataService.getTerrainMappings();
				$scope.$apply();
			}
		});

		MapDataService.loadMapData(mapType);
		MusicService.initializePlayer();
	};
    
    //*************************\\
    // FUNCTIONS FOR MAP TILE  \\
    // GLOW BOXES              \\
    //*************************\\
    
    //Returns the vertical position of a glowBox element
    $scope.determineGlowY = function(index){
    	return (index * (boxWidth + gridWidth)) + "px";
    };
    
    //Returns the horizontal position of a glowBox element
    $scope.determineGlowX = function(index){
    	return (index * (boxWidth + gridWidth)) + "px";
	};
	
	$scope.determineGlowColor = function(loc){
		if($scope.terrainLocs == undefined) return '';
		var terrainInfo = $scope.terrainLocs[loc];

		if(terrainInfo.movCount > 0) return 'rgba(0, 0, 255, 0.5)';
        else if(terrainInfo.atkCount > 0) return 'rgba(255, 0, 0, 0.5)';
        else if(terrainInfo.healCount > 0) return 'rgba(0, 255, 0, 0.5)';
		else return '';
	};

	$scope.toggleGrid = function(){
		if($scope.showGrid == 3) $scope.showGrid = 0;
		else $scope.showGrid++;	
	};
    
    //*************************\\
    // FUNCTIONS FOR MAP       \\
    // CHARACTERS/SPRITES      \\
    //*************************\\
    
    //Toggles character/enemy information box
    $scope.displayData = function(char){
		toggleCharRange(char);
    };

    $scope.removeData = function(char){
		toggleCharRange(char);
    };

	//Add/remove character's range highlighted cells
	function toggleCharRange(char){
		var movRangeList = $scope.charaData[char].range;
		var atkRangeList = $scope.charaData[char].atkRange;
		var healRangeList = $scope.charaData[char].healRange;
		
		if($scope.terrainLocs[movRangeList[0]].movCount > 0)
			var val = 1;
		else
			var val = -1;

		for(var i = 0; i < movRangeList.length; i++)
			$scope.terrainLocs[movRangeList[i]].movCount += val;
		for(var j = 0; j < atkRangeList.length; j++)
			$scope.terrainLocs[atkRangeList[j]].atkCount += val;
		for(var k = 0; k < healRangeList.length; k++)
			$scope.terrainLocs[healRangeList[k]].healCount += val;
	};
    
    //Parses an enemy's name to see if it contains a number at the end.
    //If it does, it returns that number
    $scope.getEnemyNum = function(name){
    	if(name.lastIndexOf(" ") == -1 || name == undefined)
    		return "";
    	name = name.substring(name.lastIndexOf(" "), name.length);
		name = name.trim();
		
    	if(name.match(/^[0-9]+$/) != null) return "IMG/NUM/num_" + name + ".png";
    	else return "";
    };
    
    $scope.validPosition = function(pos){
    	return pos == 'Not Deployed' || pos == 'Defeated' || pos.indexOf(",") != -1;
	};
    
    //Using a character's coordinates, calculates their horizontal
    //position on the map
    $scope.determineCharX = function(index, pos){
		if(index == 0) numDefeat = 0; 
		if(pos == "Defeated" || pos == "Not Deployed")
			return (((numDefeat % 30) * 32) + 32) + "px";

    	pos = pos.substring(0,pos.indexOf(","));
    	pos = parseInt(pos);
    	return (((pos-1) * (boxWidth + gridWidth)) + gridWidth) + "px";
    };
    
	//Using a character's coordinates, calculates their vertical
	//position on the map
	$scope.determineCharY = function(pos){
		if(pos == "Defeated" || pos == "Not Deployed"){
			numDefeat +=1;
			return ((Math.floor((numDefeat-1)/30) * (gridWidth + boxWidth)) + ($scope.rows.length * (gridWidth + boxWidth)) + 32) +"px";
		}

		pos = pos.substring(pos.indexOf(",")+1).trim();
    	pos = parseInt(pos);
    	return ((pos-1) * (boxWidth + gridWidth)) + "px";
	};
	
	$scope.determineCharZ = function(pos){
		if(pos == "Defeated" || pos == "Not Deployed") return "0";

		pos = pos.substring(pos.indexOf(",")+1).trim(); //grab first number
		return pos;

	};

	$scope.getHPPercent = function(currHp, maxHp){
		return Math.min((currHp/maxHp)*28, 28) + "px";
	};

	$scope.determineHPBackgroundColor = function(currHp, maxHp){
		currHp = parseInt(currHp) || 0;
		maxHp = parseInt(maxHp) || 1;

		if(currHp > maxHp) return "#c430ff";
		else if((currHp/maxHp) > 0.5) return "#00e003";
		else if((currHp/maxHp) > 0.25) return "#ffe100";
		else return "red";
	};

    //***************************\\
    // MOUSEOVER/MOUSEOUT EVENTS \\
    //***************************\\
	
	$scope.boxHoverIn = function(char){ $scope[char+"_boxhover"] = true; };
	$scope.boxHoverOut = function(char){ $scope[char+"_boxhover"] = false; };
	$scope.boxHoverOn = function(char){ 
		if($scope[char+"_boxhover"] == true) return ($scope.rows.length + 2) + "";
		else return ($scope.rows.length + 1) + "";
	};
	
}]);

function adjustMusicVolume(){
	var player = document.getElementById("audioPlayer");
	var slider = document.getElementById("musicVolumeSlider");
	player.volume = parseInt(slider.value) / 100;
};