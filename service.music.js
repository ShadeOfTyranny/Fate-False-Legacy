app.service('MusicService', ['$rootScope', function ($rootScope) {

    //Variables
    var playMusic = false;
    var volume = 100;
    const audio = document.getElementById("audioPlayer");
    const musicTracks = [
        {'name' : "Jeff's Theme", 'src' : "Infiltrating Enemy Territory.mp3", 'speed' : 1.25},
		{'name' : "Dror's Theme", 'src' : "Break Off.mp3", 'speed' : 1.0}
    ];

    //Functions
    this.initalizePlayer = function(){
		this.setTrack(musicTracks[0]);
		playMusic = false;
		};
    this.musicPlaying = function(){ return playMusic; };
    this.getTrackList = function(){ return musicTracks; };

    this.toggleMusic = function(){
        if(playMusic) audio.pause();
        else audio.play();
        playMusic = !playMusic;
    };

    this.setTrack = function(n){
        audio.src = "MUS/" + n.src;
        audio.load();
        audio.playbackRate = n.speed;
        if(playMusic) audio.play();
    };

}]);