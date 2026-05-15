declare module "react-native-maps" {
  import type { Component } from "react";
  import type { ViewProps } from "react-native";

  export interface Region {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  }

  export interface MapViewProps extends ViewProps {
    region?: Region;
    scrollEnabled?: boolean;
    zoomEnabled?: boolean;
    rotateEnabled?: boolean;
    pitchEnabled?: boolean;
  }

  export interface MarkerProps {
    coordinate: { latitude: number; longitude: number };
  }

  export interface CircleProps {
    center: { latitude: number; longitude: number };
    radius: number;
    fillColor?: string;
    strokeColor?: string;
    strokeWidth?: number;
  }

  export default class MapView extends Component<MapViewProps> {}
  export class Marker extends Component<MarkerProps> {}
  export class Circle extends Component<CircleProps> {}
}
