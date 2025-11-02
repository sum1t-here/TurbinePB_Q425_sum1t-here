# TurbinePB_Q425_sum1t-here

## 📁 Task 1

```
TurbinePB_Q425_sum1t-here/
├── hello-world/                # Task 1: Basic Rust Hello World
├── rust-counter/               # Task 1: Rust Counter Program
├── rng-game/                   # Task 1: Guessing Game (from Rust Book)
└── solana-counter/             # Task 2: Anchor Counter Program
    ├── programs/
    ├── tests/
    ├── README.md               # Use case documentation
    └── docs/
        ├── user-story.md       # Task 2: User Story
        └── architecture.png    # Task 2: Architectural Diagram            
```

## 🚀 Quick Start

### Rust Programs

```bash
# Hello World
cd hello-world && rustc main.rs && ./main 

# Counter
cd rust-counter && cargo run

# RNG Game
cd rng-game && cargo run
```

### Solana Anchor Program

```bash
cd solana-counter
anchor build
anchor test
anchor deploy
```