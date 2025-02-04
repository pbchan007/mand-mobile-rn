import React from 'react';
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { picker } from '../../_styles/themes/default.components';
import { innerScaleSize } from '../../_styles/themes/responsive';

interface IMDPickerColumnProps {
  itemHeight?: number;
  onPickerSelected: (
    selectIndex: number,
    selectContext: string,
    columnIndex: number
  ) => void;
  column: [];
  width: number;
  offsetY: number;
  columnIndex: number;
  selectIndex: number;
  invalidItemIndexs: number[];
}

interface IMDPickerColumnState {
  selectIndex: number;
}

export default class PickerColumn extends React.Component<
  IMDPickerColumnProps,
  IMDPickerColumnState
> {
  public static defaultProps = {
    itemHeight: innerScaleSize(40 * 2),
    onPickerSelected: null,
    invalidItemIndexs: [],
  };

  constructor (props: IMDPickerColumnProps) {
    super(props);
    this.state = {
      selectIndex: 2,
    };
  }

  private selectIndex = 0;
  private realIndex = 0;
  private oldIndex = 0;
  private isDragAnima: boolean = false;
  private scroller: ScrollView | null = null;
  private isNewProps: boolean = false;
  private columnValue: any[] = [];

  public componentWillReceiveProps (nextProps: IMDPickerColumnProps) {
    if (
      JSON.stringify(nextProps.column) !== JSON.stringify(this.props.column) ||
      nextProps.selectIndex !== this.realIndex
    ) {
      this.realIndex = this.checkValidIndex(nextProps.selectIndex, nextProps);
      this.selectIndex = this.realIndex + 2;
      this.isNewProps = true;
      this.setState({
        selectIndex: nextProps.selectIndex + 2,
      });
      this.initColumnValue(nextProps.column);
    }
  }

  public componentWillMount () {
    this.initColumnValue(this.props.column);
    this.isNewProps = true;
    this.realIndex = this.checkValidIndex(this.props.selectIndex, this.props);
    this.selectIndex = this.realIndex + 2;
    this.setState({
      selectIndex: this.selectIndex,
    });
  }

  public componentDidMount () {
    setTimeout(() => {
      this.scrollTopIndex(this.realIndex);
    }, 30);
  }

  public componentDidUpdate () {
    this.scrollTopIndex(this.realIndex);
  }

  public render () {
    return (
      <ScrollView
        ref={(scrollView: ScrollView) => {
          this.scroller = scrollView;
        }}
        style={[styles.column, { width: this.props.width }]}
        removeClippedSubviews={true}
        automaticallyAdjustContentInsets={false}
        showsVerticalScrollIndicator={false}
        onScrollBeginDrag={() => {
          this.onScrollBeginDrag();
        }}
        onScrollEndDrag={(e: NativeSyntheticEvent<NativeScrollEvent>) => {
          this.onScrollEndDrag(e);
        }}
        onMomentumScrollEnd={(e: NativeSyntheticEvent<NativeScrollEvent>) => {
          this.onMomentumScrollEnd(e);
        }}
        onMomentumScrollBegin={(e: NativeSyntheticEvent<NativeScrollEvent>) => {
          this.onMomentumScrollBegin(e);
        }}
      >
        {this.renderList(this.columnValue)}
      </ScrollView>
    );
  }

  private renderList (column: any[]) {
    return column.map((item, index) => {
      return this.renderItem(item, index);
    });
  }

  private renderItem (item: any, index: number) {
    return (
      <View
        key={index}
        style={[styles.item, { height: this.props.itemHeight! }]}
      >
        <Text
          style={[
            styles.text,
            {
              color:
                this.state.selectIndex === index
                  ? picker.colorActive
                  : picker.color,
              opacity:
                index - 2 === this.checkValidIndex(index - 2, this.props)
                  ? 1
                  : picker.disabledOpacity,
            },
          ]}
          numberOfLines={1}
        >
          {item.text || item.label}
        </Text>
      </View>
    );
  }

  private onScrollBeginDrag () {
    // console.log(
    //   'ttttpicker',
    //   'onScrollBeginDrag',
    //   this.props.columnIndex,
    //   this.isDragAnima
    // );
  }

  private onScrollEndDrag (e: NativeSyntheticEvent<NativeScrollEvent>) {
    const pIndex = this.caculateScrollIndex(e);
    setTimeout(() => {
      if (!this.isDragAnima) {
        this.updateSelectIndex(pIndex);
        this.props.onPickerSelected(
          this.realIndex,
          this.getActiveValue(),
          this.props.columnIndex
        );
      }
    }, 300);
  }

  private onMomentumScrollBegin (e: NativeSyntheticEvent<NativeScrollEvent>) {
    this.isDragAnima = true;
  }

  private onMomentumScrollEnd (e: NativeSyntheticEvent<NativeScrollEvent>) {
    const pIndex = this.caculateScrollIndex(e);
    setTimeout(() => {
      if (this.isDragAnima) {
        this.isDragAnima = false;
        this.updateSelectIndex(pIndex);
        this.props.onPickerSelected(
          this.realIndex,
          this.getActiveValue(),
          this.props.columnIndex
        );
      }
    }, 300);
  }

  private scrollToPisiton (x: number, y: number) {
    if (!this.isNewProps && Math.abs(this.selectIndex - this.oldIndex) < 2) {
      this.scroller!.scrollResponderScrollTo({ x, y, animated: true });
    } else {
      if (this.isNewProps) {
        this.isNewProps = false;
      }
      this.scroller!.scrollResponderScrollTo({ x, y, animated: false });
    }
  }

  private scrollTopIndex (index: number) {
    this.scrollToPisiton(0, index * this.props.itemHeight!);
  }

  private caculateScrollIndex (e: NativeSyntheticEvent<NativeScrollEvent>) {
    let pIndex = Math.round(
      e.nativeEvent.contentOffset.y / this.props.itemHeight!
    );
    if (pIndex < 0) {
      pIndex = 0;
    } else if (pIndex >= this.props.column.length) {
      pIndex = this.props.column.length - 1;
    }
    return pIndex;
  }

  private updateSelectIndex (index: number) {
    /// index is realIndex
    this.realIndex = index;
    this.oldIndex = this.selectIndex;
    this.selectIndex = this.checkValidIndex(index, this.props) + 2;
    this.setState({
      selectIndex: this.selectIndex,
    });
  }

  private checkValidIndex (index: number, props: IMDPickerColumnProps) {
    while (props.invalidItemIndexs.indexOf(index) >= 0) {
      ++index;
    }
    if (index >= props.column.length) {
      index = 0;
    }
    return index;
  }

  private getActiveValue () {
    const item: any = this.props.column[this.selectIndex];
    return item;
  }

  private initColumnValue (column: any[]) {
    this.columnValue = [];
    this.columnValue.push(...column);
    this.columnValue.unshift({}, {});
    this.columnValue.push({}, {});
  }
}

const styles = StyleSheet.create({
  column: {
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  item: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    textAlign: 'center',
    fontSize: picker.fontSize,
    marginLeft: 10,
    marginRight: 10,
  },
});
