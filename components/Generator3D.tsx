import React, { useRef, useState, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows, RoundedBox, Cylinder, Text, Box, MeshReflectorMaterial } from '@react-three/drei';
import * as THREE from 'three';

// ============================================================
// INTERACTIVE GENSET PANEL (HTML overlay)
// ============================================================
interface GensetDashboardProps {
    isRunning: boolean;
    onToggle: () => void;
    rpm: number;
    voltage: number;
    frequency: number;
    load: number;
    coolantTemp: number;
    oilPressure: number;
    fuelLevel: number;
    runHours: number;
}

const GensetDashboard: React.FC<GensetDashboardProps> = ({
    isRunning, onToggle, rpm, voltage, frequency, load, coolantTemp, oilPressure, fuelLevel, runHours
}) => {
    return (
        <div className="absolute bottom-0 left-0 right-0 z-[105] p-4 md:p-6 pointer-events-none">
            <div className="max-w-5xl mx-auto pointer-events-auto">
                <div className="bg-slate-900/30 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden inner-glow">

                    {/* Header Strip */}
                    <div className="flex items-center justify-between px-4 md:px-6 py-3 border-b border-white/5 bg-white/3">
                        <div className="flex items-center gap-3">
                            <div className={`w-2.5 h-2.5 rounded-full ${isRunning ? 'bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.6)] animate-pulse' : 'bg-slate-600'}`} />
                            <span className="text-xs font-bold text-slate-300 tracking-wider uppercase">
                                {isRunning ? 'ENGINE RUNNING' : 'ENGINE STANDBY'}
                            </span>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="text-[10px] text-slate-500 font-mono hidden md:inline">
                                YUCHAI YC6MK420L-D20 | 500kVA
                            </span>
                            <button
                                onClick={onToggle}
                                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${isRunning
                                    ? 'bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-900/40'
                                    : 'bg-green-600 hover:bg-green-500 text-white shadow-lg shadow-green-900/40'
                                    }`}
                            >
                                {isRunning ? '■ STOP' : '▶ START'}
                            </button>
                        </div>
                    </div>

                    {/* Gauges Grid */}
                    <div className="grid grid-cols-4 md:grid-cols-8 gap-0 divide-x divide-white/5">
                        {[
                            { label: 'RPM', value: isRunning ? rpm.toFixed(0) : '0', unit: '', warn: rpm > 1550 },
                            { label: 'VOLTAGE', value: isRunning ? voltage.toFixed(0) : '0', unit: 'V', warn: voltage < 380 || voltage > 420 },
                            { label: 'FREQ', value: isRunning ? frequency.toFixed(1) : '0.0', unit: 'Hz', warn: frequency < 49.5 || frequency > 50.5 },
                            { label: 'LOAD', value: isRunning ? load.toFixed(0) : '0', unit: '%', warn: load > 90 },
                            { label: 'COOLANT', value: isRunning ? coolantTemp.toFixed(0) : '--', unit: '°C', warn: coolantTemp > 95 },
                            { label: 'OIL PSI', value: isRunning ? oilPressure.toFixed(1) : '--', unit: 'bar', warn: oilPressure < 2.5 },
                            { label: 'FUEL', value: fuelLevel.toFixed(0), unit: '%', warn: fuelLevel < 20 },
                            { label: 'RUN HRS', value: runHours.toFixed(1), unit: 'h', warn: false },
                        ].map((gauge, i) => (
                            <div key={i} className="px-3 py-3 md:py-4 text-center">
                                <div className="text-[9px] font-bold text-slate-500 tracking-wider mb-1">{gauge.label}</div>
                                <div className={`text-sm md:text-lg font-mono font-bold ${gauge.warn ? 'text-red-400' : isRunning ? 'text-white' : 'text-slate-600'}`}>
                                    {gauge.value}
                                </div>
                                <div className="text-[9px] text-slate-600">{gauge.unit}</div>
                            </div>
                        ))}
                    </div>

                    {/* Load Bar */}
                    {isRunning && (
                        <div className="px-4 md:px-6 py-2 border-t border-white/5 bg-white/2">
                            <div className="flex items-center gap-3">
                                <span className="text-[10px] text-slate-500 font-bold w-16 shrink-0">LOAD</span>
                                <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full rounded-full transition-all duration-1000 ${load > 80 ? 'bg-red-500' : load > 60 ? 'bg-yellow-500' : 'bg-green-500'}`}
                                        style={{ width: `${load}%` }}
                                    />
                                </div>
                                <span className="text-[10px] text-slate-400 font-mono w-10 text-right">{load.toFixed(0)}%</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};


// ============================================================
// 3D GENERATOR — HYPER-REALISTIC YUCHAI 500kVA
// ============================================================
const ProceduralGenerator: React.FC<{ isRunning: boolean }> = ({ isRunning }) => {
    const fanRef = useRef<THREE.Group>(null);
    const vibrateRef = useRef<THREE.Group>(null);
    const exhaustRef = useRef<THREE.Mesh>(null);

    useFrame((state, delta) => {
        // Fan rotation
        if (fanRef.current) {
            fanRef.current.rotation.z += delta * (isRunning ? 25 : 0.5);
        }

        // Engine vibration when running
        if (vibrateRef.current && isRunning) {
            const time = state.clock.elapsedTime;
            vibrateRef.current.position.y = -1 + Math.sin(time * 30) * 0.003;
            vibrateRef.current.rotation.z = Math.sin(time * 25) * 0.001;
        }

        // Exhaust heat shimmer
        if (exhaustRef.current && isRunning) {
            const mat = exhaustRef.current.material as THREE.MeshStandardMaterial;
            mat.emissiveIntensity = 0.3 + Math.sin(state.clock.elapsedTime * 8) * 0.2;
        }
    });

    // Materials — Yuchai deep blue signature
    const bodyBlue = useMemo(() => new THREE.MeshStandardMaterial({
        color: '#1a3a7a',
        metalness: 0.7,
        roughness: 0.25,
    }), []);

    const bodyBlueDark = useMemo(() => new THREE.MeshStandardMaterial({
        color: '#112a5c',
        metalness: 0.6,
        roughness: 0.3,
    }), []);

    const engineBlack = useMemo(() => new THREE.MeshStandardMaterial({
        color: '#1a1a1a',
        metalness: 0.85,
        roughness: 0.4,
    }), []);

    const steelGray = useMemo(() => new THREE.MeshStandardMaterial({
        color: '#3a3a3a',
        metalness: 0.9,
        roughness: 0.3,
    }), []);

    const aluminum = useMemo(() => new THREE.MeshStandardMaterial({
        color: '#8a8a8a',
        metalness: 0.95,
        roughness: 0.15,
    }), []);

    const copperMat = useMemo(() => new THREE.MeshStandardMaterial({
        color: '#b87333',
        metalness: 0.8,
        roughness: 0.3,
    }), []);

    const rubberBlack = useMemo(() => new THREE.MeshStandardMaterial({
        color: '#0a0a0a',
        metalness: 0.1,
        roughness: 0.95,
    }), []);

    const accentCyan = useMemo(() => new THREE.MeshStandardMaterial({
        color: '#0ea5e9',
        metalness: 0.5,
        roughness: 0.2,
    }), []);

    const redBtn = useMemo(() => new THREE.MeshStandardMaterial({
        color: '#dc2626',
        metalness: 0.3,
        roughness: 0.4,
        emissive: '#dc2626',
        emissiveIntensity: 0.2,
    }), []);

    const greenBtn = useMemo(() => new THREE.MeshStandardMaterial({
        color: '#16a34a',
        metalness: 0.3,
        roughness: 0.4,
        emissive: isRunning ? '#16a34a' : '#000',
        emissiveIntensity: isRunning ? 0.5 : 0,
    }), [isRunning]);

    const textProps = {
        fontSize: 0.22,
        color: "#ffffff",
        outlineWidth: 0.012,
        outlineColor: "#000000",
        letterSpacing: 0.06
    };

    return (
        <group ref={vibrateRef} position={[0, -1, 0]} scale={1.15}>

            {/* ======================== BASE FRAME ======================== */}
            {/* Main structural base — heavy steel channel frame */}
            <RoundedBox args={[4.4, 0.35, 7.0]} radius={0.04} smoothness={4} position={[0, 0.18, 0]} material={steelGray} castShadow receiveShadow />
            {/* Base accent stripe */}
            <RoundedBox args={[4.6, 0.08, 7.4]} radius={0.02} smoothness={2} position={[0, 0.04, 0]} material={accentCyan} />
            {/* Forklift channels */}
            <Box args={[0.2, 0.25, 7.0]} position={[-1.8, 0.13, 0]} material={steelGray} castShadow />
            <Box args={[0.2, 0.25, 7.0]} position={[1.8, 0.13, 0]} material={steelGray} castShadow />


            {/* ======================== CANOPY / ENCLOSURE ======================== */}
            {/* Canopy removed to create an open-type generator simulation */}

            {/* ======================== ENGINE BLOCK ======================== */}
            {/* Main engine body */}
            <RoundedBox args={[1.8, 1.6, 2.8]} radius={0.08} smoothness={4} position={[0, 1.2, -0.6]} material={engineBlack} castShadow />

            {/* Cylinder head cover */}
            <RoundedBox args={[0.8, 0.4, 2.4]} radius={0.05} smoothness={4} position={[0, 2.1, -0.6]} material={bodyBlueDark} castShadow />

            {/* Valve cover — signature Yuchai blue */}
            <RoundedBox args={[0.6, 0.15, 2.2]} radius={0.03} smoothness={4} position={[0, 2.35, -0.6]} material={bodyBlue} castShadow />

            {/* Oil pan */}
            <RoundedBox args={[1.6, 0.3, 2.6]} radius={0.04} smoothness={4} position={[0, 0.55, -0.6]} material={steelGray} castShadow />

            {/* Turbocharger */}
            <Cylinder args={[0.2, 0.2, 0.35]} position={[0.7, 2.0, -0.8]} rotation={[0, 0, Math.PI / 2]} material={aluminum} castShadow />
            <Cylinder args={[0.15, 0.12, 0.25]} position={[0.7, 2.0, -0.55]} rotation={[Math.PI / 2, 0, 0]} material={aluminum} castShadow />

            {/* Intercooler piping */}
            <Cylinder args={[0.06, 0.06, 0.8]} position={[0.7, 2.2, -0.3]} rotation={[Math.PI / 2, 0, 0]} material={aluminum} castShadow />

            {/* Fuel injection pump */}
            <Box args={[0.3, 0.35, 0.5]} position={[-0.6, 1.6, -0.4]} material={engineBlack} castShadow />
            {/* Fuel lines */}
            {[0, 1, 2, 3, 4, 5].map(i => (
                <Cylinder key={`fuel-${i}`} args={[0.015, 0.015, 0.4]} position={[-0.6, 1.85, -0.6 + i * 0.06]} rotation={[0, 0, 0]} material={steelGray} />
            ))}

            {/* Exhaust manifold */}
            <Cylinder args={[0.12, 0.12, 1.6]} position={[0.9, 1.5, -0.6]} rotation={[Math.PI / 2, 0, 0]} material={steelGray} castShadow />
            {/* Exhaust vertical pipe */}
            <Cylinder args={[0.1, 0.1, 1.2]} position={[0.9, 2.2, 0.3]} material={steelGray} castShadow />
            {/* Exhaust cap/rain cap */}
            <Cylinder ref={exhaustRef} args={[0.15, 0.12, 0.1]} position={[0.9, 2.85, 0.3]} material={isRunning ? new THREE.MeshStandardMaterial({ color: '#444', emissive: '#ff4400', emissiveIntensity: 0.3, metalness: 0.8, roughness: 0.3 }) : steelGray} castShadow />

            {/* Starter motor */}
            <Cylinder args={[0.12, 0.12, 0.3]} position={[-0.9, 0.8, -0.3]} rotation={[0, 0, Math.PI / 2]} material={engineBlack} castShadow />

            {/* Oil filter */}
            <Cylinder args={[0.08, 0.08, 0.25]} position={[-0.95, 1.0, 0.1]} rotation={[0, 0, Math.PI / 2]} material={bodyBlue} castShadow />

            {/* Fuel filter */}
            <Cylinder args={[0.06, 0.06, 0.2]} position={[-0.95, 1.3, -0.2]} rotation={[0, 0, Math.PI / 2]} material={accentCyan} castShadow />

            {/* Alternator belt housing */}
            <Cylinder args={[0.3, 0.3, 0.15]} position={[0, 1.2, -2.0]} rotation={[Math.PI / 2, 0, 0]} material={engineBlack} castShadow />
            <Cylinder args={[0.15, 0.15, 0.15]} position={[0, 0.7, -2.0]} rotation={[Math.PI / 2, 0, 0]} material={engineBlack} castShadow />
            {/* Belt */}
            <Cylinder args={[0.28, 0.28, 0.04]} position={[0, 1.2, -2.08]} rotation={[Math.PI / 2, 0, 0]} material={rubberBlack} />
            <Cylinder args={[0.13, 0.13, 0.04]} position={[0, 0.7, -2.08]} rotation={[Math.PI / 2, 0, 0]} material={rubberBlack} />


            {/* ======================== COOLING SYSTEM ======================== */}
            {/* Radiator core */}
            <RoundedBox args={[1.8, 1.6, 0.3]} radius={0.04} smoothness={4} position={[0, 1.2, -2.5]} material={copperMat} castShadow />
            {/* Coolant expansion tank */}
            <Cylinder args={[0.1, 0.1, 0.3]} position={[0.8, 2.3, -2.3]} material={new THREE.MeshStandardMaterial({ color: '#1a1a1a', metalness: 0.2, roughness: 0.8, transparent: true, opacity: 0.8 })} />
            {/* Coolant hoses */}
            <Cylinder args={[0.05, 0.05, 0.6]} position={[0.3, 1.8, -2.2]} rotation={[0.3, 0, 0]} material={rubberBlack} />
            <Cylinder args={[0.05, 0.05, 0.6]} position={[-0.3, 0.8, -2.2]} rotation={[0.2, 0, 0]} material={rubberBlack} />

            {/* Fan guard */}
            <RoundedBox args={[1.9, 1.9, 0.06]} radius={0.04} smoothness={4} position={[0, 1.2, -2.7]} material={bodyBlue} castShadow />
            {/* Fan guard mesh (grid lines) */}
            {Array.from({ length: 8 }).map((_, i) => (
                <Box key={`fv-${i}`} args={[0.02, 1.6, 0.02]} position={[-0.7 + i * 0.2, 1.2, -2.74]} material={bodyBlueDark} />
            ))}
            {Array.from({ length: 6 }).map((_, i) => (
                <Box key={`fh-${i}`} args={[1.6, 0.02, 0.02]} position={[0, 0.6 + i * 0.25, -2.74]} material={bodyBlueDark} />
            ))}

            {/* Rotating fan blades */}
            <group ref={fanRef} position={[0, 1.2, -2.6]}>
                <Cylinder args={[0.15, 0.15, 0.08]} rotation={[Math.PI / 2, 0, 0]} material={engineBlack} />
                {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
                    <mesh key={i} rotation={[0, 0, (i * Math.PI) / 4]} castShadow>
                        <boxGeometry args={[0.06, 1.5, 0.015]} />
                        <meshStandardMaterial color="#e0e0e0" metalness={0.3} roughness={0.7} />
                    </mesh>
                ))}
            </group>


            {/* ======================== ALTERNATOR ======================== */}
            {/* Main alternator body */}
            <Cylinder args={[0.85, 0.85, 1.8]} position={[0, 1.2, 2.0]} rotation={[Math.PI / 2, 0, 0]} material={bodyBlue} castShadow receiveShadow />
            {/* Alternator endbell */}
            <Cylinder args={[0.75, 0.75, 0.4]} position={[0, 1.2, 2.95]} rotation={[Math.PI / 2, 0, 0]} material={engineBlack} castShadow />
            {/* Alternator cooling grille */}
            <Cylinder args={[0.7, 0.7, 0.05]} position={[0, 1.2, 3.16]} rotation={[Math.PI / 2, 0, 0]} material={steelGray} />
            {/* Winding terminal box */}
            <Box args={[0.4, 0.3, 0.3]} position={[0.7, 1.7, 2.5]} material={engineBlack} castShadow />
            {/* Terminal cover */}
            <Box args={[0.35, 0.25, 0.05]} position={[0.93, 1.7, 2.5]} material={bodyBlueDark} castShadow />
            {/* Cable entry */}
            <Cylinder args={[0.04, 0.04, 0.3]} position={[0.7, 1.5, 2.7]} material={rubberBlack} />

            {/* Coupling guard */}
            <Cylinder args={[0.5, 0.5, 0.3]} position={[0, 1.2, 0.85]} rotation={[Math.PI / 2, 0, 0]} material={steelGray} />


            {/* ======================== CONTROL PANEL ======================== */}
            <RoundedBox args={[1.4, 1.2, 0.12]} radius={0.04} position={[0, 1.8, 3.25]} material={bodyBlue} rotation={[-0.15, 0, 0]} castShadow>
                {/* Digital display screen */}
                <mesh position={[0, 0.25, 0.07]}>
                    <planeGeometry args={[0.85, 0.45]} />
                    <meshStandardMaterial color="#000" />
                </mesh>
                <mesh position={[0, 0.25, 0.071]}>
                    <planeGeometry args={[0.8, 0.4]} />
                    <meshStandardMaterial
                        color={isRunning ? '#0ea5e9' : '#1a1a1a'}
                        emissive={isRunning ? '#0ea5e9' : '#000'}
                        emissiveIntensity={isRunning ? 0.8 : 0}
                    />
                </mesh>

                {/* "YUCHAI" label on panel */}
                <Text position={[0, -0.35, 0.07]} fontSize={0.1} color="#ffffff" outlineWidth={0.005} outlineColor="#000">
                    YUCHAI 500kVA
                </Text>

                {/* E-Stop button */}
                <mesh position={[-0.4, -0.15, 0.07]} rotation={[Math.PI / 2, 0, 0]}>
                    <cylinderGeometry args={[0.1, 0.1, 0.04]} />
                    <meshStandardMaterial color="#dc2626" emissive="#dc2626" emissiveIntensity={0.3} />
                </mesh>
                {/* E-Stop ring */}
                <mesh position={[-0.4, -0.15, 0.065]}>
                    <torusGeometry args={[0.12, 0.015, 8, 24]} />
                    <meshStandardMaterial color="#fbbf24" metalness={0.7} roughness={0.3} />
                </mesh>

                {/* Start button */}
                <mesh position={[-0.1, -0.15, 0.07]} rotation={[Math.PI / 2, 0, 0]}>
                    <cylinderGeometry args={[0.07, 0.07, 0.04]} />
                    <meshStandardMaterial color={isRunning ? '#16a34a' : '#333'} emissive={isRunning ? '#16a34a' : '#000'} emissiveIntensity={isRunning ? 0.5 : 0} />
                </mesh>

                {/* Mode selector */}
                <mesh position={[0.2, -0.15, 0.07]} rotation={[Math.PI / 2, 0, 0]}>
                    <cylinderGeometry args={[0.06, 0.06, 0.03]} />
                    <meshStandardMaterial color="#555" metalness={0.8} roughness={0.2} />
                </mesh>

                {/* Status LEDs */}
                {[0.3, 0.42, 0.54].map((x, i) => (
                    <mesh key={`led-${i}`} position={[x, -0.15, 0.07]} rotation={[Math.PI / 2, 0, 0]}>
                        <cylinderGeometry args={[0.025, 0.025, 0.02]} />
                        <meshStandardMaterial
                            color={i === 0 ? '#16a34a' : i === 1 ? '#fbbf24' : '#dc2626'}
                            emissive={isRunning && i === 0 ? '#16a34a' : '#000'}
                            emissiveIntensity={isRunning && i === 0 ? 0.8 : 0}
                        />
                    </mesh>
                ))}
            </RoundedBox>


            {/* ======================== BRANDING ======================== */}
            <Text position={[2.15, 1.5, -0.5]} rotation={[0, Math.PI / 2, 0]} {...textProps}>
                YUCHAI 500kVA
            </Text>
            <Text position={[-2.15, 1.5, -0.5]} rotation={[0, -Math.PI / 2, 0]} {...textProps}>
                YUCHAI 500kVA
            </Text>
            <Text position={[2.15, 1.2, -0.5]} rotation={[0, Math.PI / 2, 0]} fontSize={0.1} color="#60a5fa" outlineWidth={0.005} outlineColor="#000">
                400kW Prime | YC6MK420L-D20
            </Text>
            <Text position={[-2.15, 1.2, -0.5]} rotation={[0, -Math.PI / 2, 0]} fontSize={0.1} color="#60a5fa" outlineWidth={0.005} outlineColor="#000">
                400kW Prime | YC6MK420L-D20
            </Text>

            {/* CE / ISO labels */}
            <Text position={[2.15, 0.8, 1.5]} rotation={[0, Math.PI / 2, 0]} fontSize={0.08} color="#888">
                ISO 9001 | CE | TUV
            </Text>


            {/* ======================== MOUNTING / DETAILS ======================== */}
            {/* Anti-vibration rubber mounts */}
            {[[-1.8, -2.8], [1.8, -2.8], [-1.8, 2.8], [1.8, 2.8], [-1.8, 0], [1.8, 0]].map(([x, z], i) => (
                <group key={`mount-${i}`} position={[x, 0.08, z]}>
                    <Cylinder args={[0.14, 0.18, 0.16]} material={rubberBlack} />
                    <Cylinder args={[0.06, 0.06, 0.04]} position={[0, 0.1, 0]} material={steelGray} />
                </group>
            ))}

            {/* Lifting eyes */}
            {[[-0.8, 2.55, 0], [0.8, 2.55, 0]].map(([x, y, z], i) => (
                <mesh key={`lift-${i}`} position={[x, y, z]}>
                    <torusGeometry args={[0.08, 0.02, 8, 16]} />
                    <meshStandardMaterial color="#666" metalness={0.9} roughness={0.2} />
                </mesh>
            ))}

            {/* Battery */}
            <Box args={[0.4, 0.3, 0.25]} position={[1.5, 0.55, 2.2]} material={engineBlack} castShadow />
            <Box args={[0.05, 0.04, 0.04]} position={[1.35, 0.72, 2.2]}>
                <meshStandardMaterial color="#dc2626" />
            </Box>
            <Box args={[0.05, 0.04, 0.04]} position={[1.65, 0.72, 2.2]}>
                <meshStandardMaterial color="#111" />
            </Box>

            {/* Fuel tank */}
            <RoundedBox args={[1.2, 0.5, 1.8]} radius={0.04} position={[-1.2, 0.65, 1.5]} material={steelGray} castShadow />
            {/* Fuel cap */}
            <Cylinder args={[0.06, 0.06, 0.05]} position={[-1.2, 0.92, 1.8]} material={aluminum} />
            {/* Fuel level sight glass */}
            <Box args={[0.04, 0.35, 0.04]} position={[-0.58, 0.65, 1.5]}>
                <meshStandardMaterial color="#fbbf24" transparent opacity={0.6} />
            </Box>

            {/* Cable tray */}
            <Box args={[0.3, 0.05, 2.0]} position={[1.7, 0.42, 0.5]} material={steelGray} />
        </group>
    );
};


// ============================================================
// ENVIRONMENT — INDUSTRIAL WAREHOUSE
// ============================================================
const WarehouseEnvironment = () => {
    return (
        <group>
            {/* Massive floor */}
            <mesh position={[0, -1.06, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
                <planeGeometry args={[120, 120]} />
                <meshStandardMaterial
                    color="#080808"
                    metalness={0.8}
                    roughness={0.2}
                />
            </mesh>

            {/* Building pillars */}
            {[[-15, -20], [15, -20], [-15, 20], [15, 20], [-15, 0], [15, 0]].map(([x, z], i) => (
                <Box key={i} args={[1.2, 35, 1.2]} position={[x, 16, z]} receiveShadow castShadow>
                    <meshStandardMaterial color="#181818" roughness={0.9} />
                </Box>
            ))}

            {/* Steel roof trusses */}
            {[-20, 0, 20].map((z, i) => (
                <Box key={i} args={[35, 0.8, 0.8]} position={[0, 33, z]} receiveShadow castShadow>
                    <meshStandardMaterial color="#151515" roughness={0.7} metalness={0.5} />
                </Box>
            ))}

            {/* Back wall */}
            <Box args={[120, 35, 0.5]} position={[0, 16, -35]} receiveShadow>
                <meshStandardMaterial color="#0a0a0a" roughness={1} />
            </Box>
        </group>
    );
};


// ============================================================
// MAIN EXPORT
// ============================================================
export default function Generator3D() {
    const [isRunning, setIsRunning] = useState(false);
    const [dashData, setDashData] = useState({
        rpm: 1500, voltage: 400, frequency: 50.0, load: 65,
        coolantTemp: 82, oilPressure: 3.8, fuelLevel: 74, runHours: 1247.3
    });

    // Simulate live gauge fluctuations
    React.useEffect(() => {
        if (!isRunning) return;
        const interval = setInterval(() => {
            setDashData(prev => ({
                rpm: 1500 + (Math.random() - 0.5) * 20,
                voltage: 400 + (Math.random() - 0.5) * 8,
                frequency: 50.0 + (Math.random() - 0.5) * 0.4,
                load: Math.min(100, Math.max(10, prev.load + (Math.random() - 0.5) * 5)),
                coolantTemp: Math.min(98, Math.max(75, prev.coolantTemp + (Math.random() - 0.48) * 1)),
                oilPressure: 3.8 + (Math.random() - 0.5) * 0.6,
                fuelLevel: Math.max(0, prev.fuelLevel - 0.01),
                runHours: prev.runHours + 0.001,
            }));
        }, 500);
        return () => clearInterval(interval);
    }, [isRunning]);

    return (
        <div className="absolute inset-0 w-full h-full z-[100] bg-slate-950 overflow-hidden">
            <Canvas
                camera={{ position: [9, 5, -10], fov: 45 }}
                gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
                shadows
                dpr={[1, 1.5]}
            >
                <color attach="background" args={['#030303']} />
                <fog attach="fog" args={['#030303', 12, 55]} />

                {/* Lighting — dramatic industrial setup */}
                <ambientLight intensity={1.5} />
                <Environment preset="city" />

                {/* Main key light — warm overhead halogen */}
                <spotLight
                    position={[12, 22, -12]}
                    angle={0.45}
                    penumbra={1}
                    intensity={200}
                    castShadow
                    shadow-bias={-0.0001}
                    shadow-mapSize={[2048, 2048]}
                    color="#fff5e6"
                />

                {/* Fill light — cool blue accent */}
                <pointLight position={[-10, 15, 10]} intensity={150} color="#0ea5e9" distance={35} decay={2} castShadow />
                {/* Rim light */}
                <pointLight position={[10, 8, 12]} intensity={100} color="#ffffff" distance={25} decay={2} />

                {/* Running indicator light — green glow when engine is on */}
                {isRunning && (
                    <pointLight position={[0, 3, 3.5]} intensity={120} color="#22c55e" distance={8} decay={2} />
                )}

                <ProceduralGenerator isRunning={isRunning} />
                <WarehouseEnvironment />

                <ContactShadows
                    position={[0, -1.05, 0]}
                    opacity={0.85}
                    scale={25}
                    blur={2.5}
                    far={6}
                    color="#000000"
                    resolution={1024}
                />

                <OrbitControls
                    autoRotate
                    autoRotateSpeed={isRunning ? 0.8 : 0.4}
                    enablePan={false}
                    maxPolarAngle={Math.PI / 2 - 0.05}
                    minDistance={5}
                    maxDistance={22}
                    dampingFactor={0.05}
                />
            </Canvas>

            {/* Interactive Dashboard Overlay */}
            <GensetDashboard
                isRunning={isRunning}
                onToggle={() => setIsRunning(!isRunning)}
                rpm={dashData.rpm}
                voltage={dashData.voltage}
                frequency={dashData.frequency}
                load={dashData.load}
                coolantTemp={dashData.coolantTemp}
                oilPressure={dashData.oilPressure}
                fuelLevel={dashData.fuelLevel}
                runHours={dashData.runHours}
            />
        </div>
    );
}
