{ pkgs ? import <nixpkgs> {} }:

pkgs.mkShell {
  buildInputs = [
    pkgs.deno
  ];

  shellHook = ''
    echo "Deno is ready to use. Run your project with 'deno run dev'."
  '';
}

