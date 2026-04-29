{
  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixos-unstable";
  };

  outputs = { self, nixpkgs }:
    let
      system = "x86_64-linux";
      pkgs = nixpkgs.legacyPackages.${system};
      pwdp = "${pkgs.playwright-driver.browsers}";
    in {
      devShells.${system}.default = pkgs.mkShell {
        nativeBuildInputs = [
          pkgs.playwright
          pkgs.playwright-driver.browsers
          pkgs.nodePackages.nodejs
          pkgs.nodePackages.npm
        ];
        shellHook = ''
          ls "${pwdp}"
          export PLAYWRIGHT_BROWSERS_PATH=${pwdp}
          export PLAYWRIGHT_SKIP_VALIDATE_HOST_REQUIREMENTS=true
          export PLAYWRIGHT_HOST_PLATFORM_OVERRIDE="ubuntu-24.04"
        '';
      };
    };
}

{
  description = "youtube video uploader cli via automated web actions";
  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };
  outputs = inputs: (
    inputs.flake-utils.lib.eachDefaultSystem (system: (
      let
        pkgs = inputs.nixpkgs.legacyPackages.${system};
        pwdp = "${pkgs.playwright-driver.browsers}";
        nativeBuildInputs = [
          pkgs.playwright
          pkgs.playwright-driver.browsers
          pkgs.nodePackages.nodejs
          pkgs.nodePackages.npm
        ];
        vars = [
          ["PLAYWRIGHT_BROWSERS_PATH" pwdp]
          ["PLAYWRIGHT_SKIP_VALIDATE_HOST_REQUIREMENTS" "true"]
          ["PLAYWRIGHT_SKIP_VALIDATE_HOST_REQUIREMENTS" "ubuntu-24.04"]
        ];
        ## TODO generate from vars
        shellHook = ''
          export PLAYWRIGHT_BROWSERS_PATH=${pwdp}
          export PLAYWRIGHT_SKIP_VALIDATE_HOST_REQUIREMENTS=true
          export PLAYWRIGHT_HOST_PLATFORM_OVERRIDE="ubuntu-24.04"
        '';
        yt-upload-pw = (pkgs.callPackage ./default.nix (
          { inherit nativeBuildInputs shellHook; }
        ));
      in {
        packages = {
          yt-upload-pw = yt-upload-pw;
          default = yt-upload-pw;
        };
        devShells.default = (
          pkgs.mkShell { inherit nativeBuildInputs vars; }
        );
      }
    ))
  );
}
