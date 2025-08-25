import {ComponentFixture, TestBed} from '@angular/core/testing';
import {RawEventsComponent} from './RawEventsComponent';

describe('RawEventsComponent', () => {

  let component: RawEventsComponent;
  let fixture: ComponentFixture<RawEventsComponent>;

  beforeEach(async () => {

    await TestBed.configureTestingModule({
      declarations: [], imports: [RawEventsComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(RawEventsComponent);
    component = fixture.componentInstance;

  });

  afterEach(() => {
    jest.clearAllMocks();
    fixture.destroy();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

});
